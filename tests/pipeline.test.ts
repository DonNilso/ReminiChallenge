import { test } from "node:test";
import assert from "node:assert/strict";
import { runStyleSet, type PipelineEvent } from "../lib/server/pipeline.ts";
import type { StyleProvider, StyleRequest } from "../lib/server/providers/types.ts";
import { HttpError } from "../lib/server/retry.ts";
import { TRENDS } from "../lib/trends.ts";

const trend = TRENDS[0];
const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ data: Buffer.from(`photo-${i}`) }));
const noSleep = { sleep: async () => {}, baseDelayMs: 1 };

function fakeProvider(opts: { failFor?: (req: StyleRequest, call: number) => Error | null; delay?: number } = {}) {
  const calls: { input: string; reference?: string }[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  let n = 0;
  const provider: StyleProvider = {
    name: "demo",
    async style(req) {
      const call = n++;
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      try {
        await new Promise((r) => setTimeout(r, opts.delay ?? 5));
        calls.push({ input: req.image.toString(), reference: req.reference?.toString() });
        const err = opts.failFor?.(req, call);
        if (err) throw err;
        return { image: Buffer.from(`styled(${req.image.toString()})`), mime: "image/jpeg" };
      } finally {
        inFlight--;
      }
    },
  };
  return { provider, calls, maxInFlight: () => maxInFlight };
}

test("styles the first photo alone, then uses it as the style reference for the rest", async () => {
  const fp = fakeProvider();
  const events: PipelineEvent[] = [];
  await runStyleSet({ provider: fp.provider, trend, photos: photos(6), emit: (e) => events.push(e), retry: noSleep });

  assert.equal(fp.calls[0].input, "photo-0");
  assert.equal(fp.calls[0].reference, undefined);
  for (const c of fp.calls.slice(1)) assert.equal(c.reference, "styled(photo-0)");
  assert.equal(fp.calls.length, 6);

  const done = events.at(-1);
  assert.deepEqual(done && done.type === "done" && { ok: done.ok, failed: done.failed, anchor: done.anchorIndex }, { ok: 6, failed: 0, anchor: 0 });
  assert.equal(events[0].type, "start");
  const finished = events.filter((e) => e.type === "photo" && e.status === "done");
  assert.equal(finished.length, 6);
});

test("respects the concurrency limit (max 3)", async () => {
  const fp = fakeProvider({ delay: 20 });
  await runStyleSet({ provider: fp.provider, trend, photos: photos(10), emit: () => {}, concurrency: 5, retry: noSleep });
  assert.ok(fp.maxInFlight() <= 3, `max in flight was ${fp.maxInFlight()}`);
  assert.ok(fp.maxInFlight() >= 2);
});

test("retries rate-limit errors and then succeeds", async () => {
  const fp = fakeProvider({ failFor: (_req, call) => (call < 2 ? new HttpError("rate limited", 429) : null) });
  const events: PipelineEvent[] = [];
  await runStyleSet({ provider: fp.provider, trend, photos: photos(3), emit: (e) => events.push(e), retry: noSleep });
  const retries = events.filter((e) => e.type === "photo" && e.status === "retrying");
  assert.equal(retries.length, 2);
  const done = events.at(-1)!;
  assert.ok(done.type === "done" && done.ok === 3 && done.failed === 0);
});

test("falls back to the next photo as anchor when the first one fails", async () => {
  const fp = fakeProvider({ failFor: (req) => (req.image.toString() === "photo-0" ? new HttpError("bad image", 400) : null) });
  const events: PipelineEvent[] = [];
  await runStyleSet({ provider: fp.provider, trend, photos: photos(4), emit: (e) => events.push(e), retry: noSleep });
  const done = events.at(-1)!;
  assert.ok(done.type === "done");
  assert.equal(done.anchorIndex, 1);
  assert.equal(done.ok, 3);
  assert.equal(done.failed, 1);
  // 400s are not retried
  assert.equal(fp.calls.filter((c) => c.input === "photo-0").length, 1);
  for (const c of fp.calls.filter((c) => c.input === "photo-2" || c.input === "photo-3")) assert.equal(c.reference, "styled(photo-1)");
});

test("a failing non-anchor photo does not stop the set", async () => {
  const fp = fakeProvider({ failFor: (req) => (req.image.toString() === "photo-2" ? new HttpError("upstream", 503) : null) });
  const events: PipelineEvent[] = [];
  await runStyleSet({ provider: fp.provider, trend, photos: photos(4), emit: (e) => events.push(e), retry: { ...noSleep, retries: 2 } });
  const done = events.at(-1)!;
  assert.ok(done.type === "done" && done.ok === 3 && done.failed === 1);
  assert.equal(fp.calls.filter((c) => c.input === "photo-2").length, 3); // 1 + 2 retries
});

test("rejects more than 10 photos", async () => {
  const fp = fakeProvider();
  await assert.rejects(runStyleSet({ provider: fp.provider, trend, photos: photos(11), emit: () => {} }), /At most 10/);
});

test("stops early when the backend is down instead of retrying every photo as anchor", async () => {
  const fp = fakeProvider({ failFor: () => new HttpError("down", 503) });
  const events: PipelineEvent[] = [];
  await runStyleSet({ provider: fp.provider, trend, photos: photos(5), emit: (e) => events.push(e), retry: { ...noSleep, retries: 2 } });
  assert.equal(fp.calls.length, 3); // only the first photo, 1 + 2 retries
  const done = events.at(-1)!;
  assert.ok(done.type === "done" && done.ok === 0 && done.failed === 5 && done.anchorIndex === null);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { runStyleSet, type PipelineEvent, type StyleFn } from "../lib/shared/pipeline.ts";
import { HttpError } from "../lib/shared/retry.ts";

const photos = (n: number) => Array.from({ length: n }, (_, i) => `photo-${i}`);
const noSleep = { sleep: async () => {}, baseDelayMs: 1 };

function fakeStyle(opts: { failFor?: (photo: string, call: number) => Error | null; delay?: number } = {}) {
  const calls: { input: string; reference?: string }[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  let n = 0;
  const style: StyleFn<string, string> = async (photo, reference) => {
    const call = n++;
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      await new Promise((r) => setTimeout(r, opts.delay ?? 5));
      calls.push({ input: photo, reference });
      const err = opts.failFor?.(photo, call);
      if (err) throw err;
      return { output: `styled(${photo})` };
    } finally {
      inFlight--;
    }
  };
  return { style, calls, maxInFlight: () => maxInFlight };
}

const lastDone = (events: PipelineEvent<string>[]) => {
  const e = events.at(-1)!;
  assert.equal(e.type, "done");
  return e as Extract<PipelineEvent<string>, { type: "done" }>;
};

test("styles the first photo alone, then uses it as the style reference for the rest", async () => {
  const fs = fakeStyle();
  const events: PipelineEvent<string>[] = [];
  await runStyleSet({ style: fs.style, photos: photos(6), emit: (e) => events.push(e), retry: noSleep });

  assert.equal(fs.calls[0].input, "photo-0");
  assert.equal(fs.calls[0].reference, undefined);
  for (const c of fs.calls.slice(1)) assert.equal(c.reference, "styled(photo-0)");
  assert.equal(fs.calls.length, 6);

  const done = lastDone(events);
  assert.deepEqual({ ok: done.ok, failed: done.failed, anchor: done.anchorIndex }, { ok: 6, failed: 0, anchor: 0 });
  assert.equal(events[0].type, "start");
  const finished = events.filter((e) => e.type === "photo" && e.status === "done");
  assert.equal(finished.length, 6);
});

test("respects the concurrency limit (max 3)", async () => {
  const fs = fakeStyle({ delay: 20 });
  await runStyleSet({ style: fs.style, photos: photos(10), emit: () => {}, concurrency: 5, retry: noSleep });
  assert.ok(fs.maxInFlight() <= 3, `max in flight was ${fs.maxInFlight()}`);
  assert.ok(fs.maxInFlight() >= 2);
});

test("retries rate-limit errors and then succeeds", async () => {
  const fs = fakeStyle({ failFor: (_p, call) => (call < 2 ? new HttpError("rate limited", 429) : null) });
  const events: PipelineEvent<string>[] = [];
  await runStyleSet({ style: fs.style, photos: photos(3), emit: (e) => events.push(e), retry: noSleep });
  const retries = events.filter((e) => e.type === "photo" && e.status === "retrying");
  assert.equal(retries.length, 2);
  const done = lastDone(events);
  assert.ok(done.ok === 3 && done.failed === 0);
});

test("falls back to the next photo as anchor when the first one fails", async () => {
  const fs = fakeStyle({ failFor: (p) => (p === "photo-0" ? new HttpError("bad image", 400) : null) });
  const events: PipelineEvent<string>[] = [];
  await runStyleSet({ style: fs.style, photos: photos(4), emit: (e) => events.push(e), retry: noSleep });
  const done = lastDone(events);
  assert.equal(done.anchorIndex, 1);
  assert.equal(done.ok, 3);
  assert.equal(done.failed, 1);
  // 400s are not retried
  assert.equal(fs.calls.filter((c) => c.input === "photo-0").length, 1);
  for (const c of fs.calls.filter((c) => c.input === "photo-2" || c.input === "photo-3")) assert.equal(c.reference, "styled(photo-1)");
});

test("a failing non-anchor photo does not stop the set", async () => {
  const fs = fakeStyle({ failFor: (p) => (p === "photo-2" ? new HttpError("upstream", 503) : null) });
  const events: PipelineEvent<string>[] = [];
  await runStyleSet({ style: fs.style, photos: photos(4), emit: (e) => events.push(e), retry: { ...noSleep, retries: 2 } });
  const done = lastDone(events);
  assert.ok(done.ok === 3 && done.failed === 1);
  assert.equal(fs.calls.filter((c) => c.input === "photo-2").length, 3); // 1 + 2 retries
});

test("stops early when the backend is down instead of retrying every photo as anchor", async () => {
  const fs = fakeStyle({ failFor: () => new HttpError("down", 503) });
  const events: PipelineEvent<string>[] = [];
  await runStyleSet({ style: fs.style, photos: photos(5), emit: (e) => events.push(e), retry: { ...noSleep, retries: 2 } });
  assert.equal(fs.calls.length, 3); // only the first photo, 1 + 2 retries
  const done = lastDone(events);
  assert.ok(done.ok === 0 && done.failed === 5 && done.anchorIndex === null);
});

test("rejects more than 10 photos", async () => {
  const fs = fakeStyle();
  await assert.rejects(runStyleSet({ style: fs.style, photos: photos(11), emit: () => {} }), /At most 10/);
});

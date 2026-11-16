import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { buildPrompt } from "../lib/prompt.ts";
import { mapLimit } from "../lib/server/concurrency.ts";
import { HttpError, parseRetryAfter, withRetry } from "../lib/server/retry.ts";
import { createModalProvider } from "../lib/server/providers/modal.ts";
import { applyGrade } from "../lib/server/providers/demo.ts";
import { getProvider } from "../lib/server/providers/index.ts";
import { TRENDS } from "../lib/trends.ts";

test("trends.json has the six required trends with full style prompts", () => {
  assert.deepEqual(
    TRENDS.map((t) => t.name),
    ["Film grain", "Golden hour", "Old money", "Clean & minimal", "Candid", "Y2K flash"],
  );
  for (const t of TRENDS) {
    assert.ok(["rising", "steady"].includes(t.status));
    assert.ok(t.description.length > 10);
    assert.ok(t.stylePrompt.split(" ").length > 40, `${t.id} prompt too short`);
  }
});

test("prompt keeps identity rules and only mentions Picture 2 when there is a reference", () => {
  const a = buildPrompt("warm look", false);
  const b = buildPrompt("warm look", true);
  for (const p of [a.prompt, b.prompt]) {
    assert.match(p, /Picture 1/);
    assert.match(p, /same faces/);
    assert.match(p, /Do not add, remove/);
    assert.match(p, /warm look/);
  }
  assert.doesNotMatch(a.prompt, /Picture 2/);
  assert.match(b.prompt, /Picture 2 is a style reference/);
  // stays well inside the 512-token text-encoder window (rough: 1 token ≈ 0.75 words)
  const longest = Math.max(...TRENDS.map((t) => buildPrompt(t.stylePrompt, true).prompt.split(/\s+/).length));
  assert.ok(longest < 300, `prompt is ${longest} words`);
});

test("withRetry: honours Retry-After, gives up on non-retryable errors", async () => {
  const delays: number[] = [];
  let n = 0;
  const v = await withRetry(
    async () => {
      if (n++ < 1) throw new HttpError("slow down", 429, 1234);
      return "ok";
    },
    { sleep: async (ms) => void delays.push(ms) },
  );
  assert.equal(v, "ok");
  assert.deepEqual(delays, [1234]);

  let calls = 0;
  await assert.rejects(
    withRetry(async () => {
      calls++;
      throw new HttpError("bad", 400);
    }),
  );
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw new HttpError("busy", 503);
      },
      { retries: 3, sleep: async () => {} },
    ),
  );
  assert.equal(calls, 4);
  assert.equal(parseRetryAfter("3"), 3000);
  assert.equal(parseRetryAfter(null), undefined);
});

test("mapLimit preserves order and captures rejections", async () => {
  const res = await mapLimit([1, 2, 3, 4], 2, async (x) => {
    if (x === 3) throw new Error("three");
    return x * 10;
  });
  assert.deepEqual(
    res.map((r) => (r.status === "fulfilled" ? r.value : (r.reason as Error).message)),
    [10, 20, "three", 40],
  );
});

test("modal provider: request shape, auth headers, errors", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  let status = 200;
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen.push({ url, init });
    if (status !== 200) return new Response("busy", { status, headers: { "retry-after": "2" } });
    return Response.json({ image_b64: Buffer.from("jpegbytes").toString("base64"), inference_seconds: 3.2 });
  }) as unknown as typeof fetch;
  const p = createModalProvider({ endpointUrl: "https://x.modal.run/", proxyKey: "wk-1", proxySecret: "ws-2", colorLock: 0.4, timeoutMs: 1000, fetchImpl: fakeFetch });
  const trend = TRENDS[1];

  const r = await p.style({ image: Buffer.from("img"), reference: Buffer.from("ref"), trend, seed: 7 });
  assert.equal(r.image.toString(), "jpegbytes");
  assert.equal(r.inferenceSeconds, 3.2);
  assert.equal(seen[0].url, "https://x.modal.run/restyle");
  const h = seen[0].init.headers as Record<string, string>;
  assert.equal(h["Modal-Key"], "wk-1");
  assert.equal(h["Modal-Secret"], "ws-2");
  const body = JSON.parse(String(seen[0].init.body));
  assert.equal(Buffer.from(body.image_b64, "base64").toString(), "img");
  assert.equal(Buffer.from(body.reference_b64, "base64").toString(), "ref");
  assert.equal(body.seed, 7);
  assert.equal(body.color_lock, 0.4);
  assert.match(body.prompt, /Golden hour|golden hour/i);
  assert.match(body.prompt, /Picture 2/);

  // anchor request: no reference, no colour lock
  await p.style({ image: Buffer.from("img"), trend, seed: 7 });
  const body2 = JSON.parse(String(seen[1].init.body));
  assert.equal(body2.reference_b64, undefined);
  assert.equal(body2.color_lock, 0);

  status = 429;
  await assert.rejects(p.style({ image: Buffer.from("img"), trend, seed: 1 }), (e: unknown) => e instanceof HttpError && e.status === 429 && e.retryAfterMs === 2000);
});

test("getProvider picks demo without a Modal URL", () => {
  assert.equal(getProvider({} as NodeJS.ProcessEnv).name, "demo");
  assert.equal(getProvider({ MODAL_ENDPOINT_URL: "https://x.modal.run" } as unknown as NodeJS.ProcessEnv).name, "modal");
  assert.equal(getProvider({ MODAL_ENDPOINT_URL: "https://x.modal.run", DEMO_MODE: "1" } as unknown as NodeJS.ProcessEnv).name, "demo");
});

test("demo grade keeps size and changes colour per trend", async () => {
  const input = await sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 90, g: 120, b: 160 } } }).jpeg().toBuffer();
  const means: number[][] = [];
  for (const t of TRENDS) {
    const out = await applyGrade(input, t.demo, 3);
    const meta = await sharp(out).metadata();
    assert.equal(meta.format, "jpeg");
    assert.equal(meta.width, 320);
    assert.equal(meta.height, 240);
    const s = await sharp(out).stats();
    means.push(s.channels.slice(0, 3).map((c) => Math.round(c.mean)));
  }
  assert.equal(new Set(means.map((m) => m.join(","))).size, TRENDS.length);
});

test("look spread: identical colours spread 0, different colours spread more", async () => {
  const { meanLab, spread, srgbToLab } = await import("../lib/server/consistency.ts");
  const solid = (r: number, g: number, b: number) => sharp({ create: { width: 32, height: 32, channels: 3, background: { r, g, b } } }).png().toBuffer();
  const white = srgbToLab(255, 255, 255);
  assert.ok(Math.abs(white[0] - 100) < 0.01 && Math.abs(white[1]) < 0.01 && Math.abs(white[2]) < 0.01);
  const same = await Promise.all([solid(200, 120, 60), solid(200, 120, 60)].map(async (b) => meanLab(await b)));
  const diff = await Promise.all([solid(200, 120, 60), solid(40, 90, 200)].map(async (b) => meanLab(await b)));
  assert.ok(spread(same) < 0.01);
  assert.ok(spread(diff) > 20);
});

import { getTrend } from "@/lib/trends.ts";
import { getProvider } from "@/lib/server/providers/index.ts";
import { HttpError, withRetry } from "@/lib/shared/retry.ts";
import { errorMessage } from "@/lib/shared/pipeline.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 300 s is the maximum on Vercel's Hobby plan (and the default on all plans with Fluid compute).
export const maxDuration = 300;

// Vercel caps a function's request body at 4.5 MB; photo + reference must fit together.
const MAX_FILE_BYTES = 2 * 1024 * 1024;

/**
 * POST multipart/form-data, ONE photo per request:
 *   trendId, seed, photo (image file), reference (optional: the styled anchor photo)
 * Responds with the styled JPEG bytes (X-Inference-Seconds header when the GPU reports it),
 * or JSON {error} with the upstream status (429/5xx are retryable by the client).
 *
 * The set-level logic (anchor first, then the rest with the anchor as reference, max 3 in
 * flight, max 10 photos) lives in lib/shared/pipeline.ts and runs in the browser, so each
 * request stays small and short enough for serverless limits. Photos are only held in
 * memory for the duration of the request.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const trend = getTrend(String(form.get("trendId") ?? ""));
  if (!trend) return Response.json({ error: "Unknown trend" }, { status: 400 });
  const seed = Number(form.get("seed") ?? 42) | 0;

  const photo = form.get("photo");
  const reference = form.get("reference");
  if (!(photo instanceof File)) return Response.json({ error: "No photo" }, { status: 400 });
  for (const f of [photo, reference]) {
    if (!(f instanceof File)) continue;
    if (!f.type.startsWith("image/")) return Response.json({ error: `${f.name} is not an image` }, { status: 400 });
    if (f.size > MAX_FILE_BYTES) return Response.json({ error: `${f.name} is larger than 2 MB` }, { status: 413 });
  }

  const provider = getProvider();
  try {
    const image = Buffer.from(await photo.arrayBuffer());
    const ref = reference instanceof File ? Buffer.from(await reference.arrayBuffer()) : undefined;
    // Quick server-side retries for rate limits / overload only. Timeouts are not retried
    // here (they would not fit in the function's time limit); the browser retries those.
    const result = await withRetry(() => provider.style({ image, reference: ref, trend, seed, signal: req.signal }), {
      retries: 2,
      baseDelayMs: 1500,
      maxDelayMs: 8000,
      shouldRetry: (e) => e instanceof HttpError && (e.status === 429 || e.status === 503),
    });
    const headers: Record<string, string> = {
      "Content-Type": result.mime,
      "Cache-Control": "no-store",
      "X-Provider": provider.name,
    };
    if (result.inferenceSeconds !== undefined) headers["X-Inference-Seconds"] = String(result.inferenceSeconds);
    return new Response(new Uint8Array(result.image), { headers });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : (err as Error)?.name === "TimeoutError" ? 504 : 502;
    const headers: Record<string, string> = {};
    if (err instanceof HttpError && err.retryAfterMs !== undefined) headers["Retry-After"] = String(Math.ceil(err.retryAfterMs / 1000));
    return Response.json({ error: errorMessage(err) }, { status, headers });
  }
}

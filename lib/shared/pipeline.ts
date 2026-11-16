import { mapLimit } from "./concurrency.ts";
import { isRetryable, withRetry, type RetryOptions } from "./retry.ts";

/**
 * Runs in the browser (the app: one HTTP request per photo, so every request stays
 * under serverless body/duration limits) and in Node (scripts/bench.ts, calling the
 * provider directly). P is a photo (Blob or Buffer), R a styled result.
 */

export const MAX_PHOTOS = 10;
export const DEFAULT_CONCURRENCY = 3;

export type Role = "anchor" | "matched";

export type StyleFn<P, R> = (
  photo: P,
  reference: R | undefined,
  ctx: { index: number; role: Role; signal?: AbortSignal },
) => Promise<{ output: R; inferenceSeconds?: number }>;

export type PipelineEvent<R> =
  | { type: "start"; total: number; concurrency: number }
  | { type: "photo"; index: number; status: "processing"; role: Role }
  | { type: "photo"; index: number; status: "retrying"; attempt: number; reason: string; delayMs: number }
  | { type: "photo"; index: number; status: "done"; role: Role; output: R; ms: number; attempts: number; inferenceSeconds?: number }
  | { type: "photo"; index: number; status: "error"; error: string }
  | { type: "done"; ok: number; failed: number; totalMs: number; anchorIndex: number | null };

export type PipelineOptions<P, R> = {
  photos: P[];
  style: StyleFn<P, R>;
  emit: (e: PipelineEvent<R>) => void;
  concurrency?: number;
  signal?: AbortSignal;
  retry?: RetryOptions;
};

/**
 * The consistency strategy:
 *  1. Style one photo on its own (the "anchor") with the trend's style prompt.
 *  2. Style every other photo with the same prompt AND the styled anchor as a style
 *     reference image, so colour grade and grain converge on one look.
 * If the anchor fails because of the photo itself, the next photo is tried as anchor;
 * if it fails because the backend is unavailable, the run stops early.
 * Remaining photos run with a concurrency limit (2–3) and retry on rate limits.
 */
export async function runStyleSet<P, R>(opts: PipelineOptions<P, R>): Promise<void> {
  const { photos, style, emit, signal } = opts;
  if (photos.length === 0) throw new Error("No photos");
  if (photos.length > MAX_PHOTOS) throw new Error(`At most ${MAX_PHOTOS} photos per run`);
  const concurrency = Math.max(1, Math.min(3, opts.concurrency ?? DEFAULT_CONCURRENCY));
  const t0 = Date.now();
  let ok = 0;
  let failed = 0;

  emit({ type: "start", total: photos.length, concurrency });

  const styleOne = async (index: number, role: Role, reference?: R): Promise<R> => {
    emit({ type: "photo", index, status: "processing", role });
    const started = Date.now();
    let attempts = 0;
    const result = await withRetry(
      (attempt) => {
        attempts = attempt;
        if (signal?.aborted) throw new Error("Cancelled");
        return style(photos[index], reference, { index, role, signal });
      },
      {
        ...opts.retry,
        onRetry: (attempt, err, delayMs) =>
          emit({ type: "photo", index, status: "retrying", attempt, delayMs, reason: errorMessage(err) }),
      },
    );
    ok++;
    emit({
      type: "photo",
      index,
      status: "done",
      role,
      output: result.output,
      ms: Date.now() - started,
      attempts,
      inferenceSeconds: result.inferenceSeconds,
    });
    return result.output;
  };

  // 1. Anchor
  let anchor: R | undefined;
  let anchorIndex: number | null = null;
  for (let i = 0; i < photos.length && anchorIndex === null; i++) {
    if (signal?.aborted) break;
    try {
      anchor = await styleOne(i, "anchor");
      anchorIndex = i;
    } catch (err) {
      failed++;
      emit({ type: "photo", index: i, status: "error", error: errorMessage(err) });
      // A photo-specific problem (e.g. 400 bad image): try the next photo as anchor.
      // A backend problem that survived all retries (rate limit, 5xx, network): stop,
      // the other photos would only fail the same way after more waiting.
      if (isRetryable(err)) {
        for (let j = i + 1; j < photos.length; j++) {
          failed++;
          emit({ type: "photo", index: j, status: "error", error: "Skipped: the styling service is unavailable" });
        }
        break;
      }
    }
  }

  // 2. Everything after the anchor, matched to it
  if (anchorIndex !== null) {
    const rest = photos.map((_, i) => i).filter((i) => i > anchorIndex!);
    const results = await mapLimit(rest, concurrency, (i) => styleOne(i, "matched", anchor));
    results.forEach((r, k) => {
      if (r.status === "rejected") {
        failed++;
        emit({ type: "photo", index: rest[k], status: "error", error: errorMessage(r.reason) });
      }
    });
  }

  emit({ type: "done", ok, failed, totalMs: Date.now() - t0, anchorIndex });
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  return String(err).slice(0, 300);
}

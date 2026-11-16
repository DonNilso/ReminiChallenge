"use client";

import type { StyleFn } from "@/lib/shared/pipeline.ts";
import { HttpError, parseRetryAfter } from "@/lib/shared/retry.ts";

/** StyleFn that styles one photo per request via POST /api/style. */
export function styleViaApi(trendId: string, seed: number): StyleFn<Blob, Blob> {
  return async (photo, reference, { index, signal }) => {
    const form = new FormData();
    form.append("trendId", trendId);
    form.append("seed", String(seed));
    form.append("photo", photo, `photo-${String(index + 1).padStart(2, "0")}.jpg`);
    if (reference) form.append("reference", reference, "reference.jpg");
    const res = await fetch("/api/style", { method: "POST", body: form, signal });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      const msg = j.error ?? (res.status === 413 ? "Photo is too large to upload" : `Server error ${res.status}`);
      throw new HttpError(msg, res.status, parseRetryAfter(res.headers.get("retry-after")));
    }
    const secs = Number(res.headers.get("x-inference-seconds"));
    return { output: await res.blob(), inferenceSeconds: Number.isFinite(secs) && secs > 0 ? secs : undefined };
  };
}

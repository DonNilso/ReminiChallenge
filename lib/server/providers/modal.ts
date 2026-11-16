import { buildPrompt } from "../../prompt.ts";
import { HttpError, parseRetryAfter } from "../retry.ts";
import type { StyleProvider, StyleRequest, StyleResult } from "./types.ts";

export type ModalConfig = {
  endpointUrl: string;
  proxyKey?: string;
  proxySecret?: string;
  colorLock: number;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

export function createModalProvider(cfg: ModalConfig): StyleProvider {
  const base = cfg.endpointUrl.replace(/\/+$/, "");
  const doFetch = cfg.fetchImpl ?? fetch;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.proxyKey && cfg.proxySecret) {
    headers["Modal-Key"] = cfg.proxyKey;
    headers["Modal-Secret"] = cfg.proxySecret;
  }

  return {
    name: "modal",

    async style(req: StyleRequest): Promise<StyleResult> {
      const { prompt, negativePrompt } = buildPrompt(req.trend.stylePrompt, Boolean(req.reference));
      const body = {
        image_b64: req.image.toString("base64"),
        reference_b64: req.reference?.toString("base64"),
        prompt,
        negative_prompt: negativePrompt,
        seed: req.seed,
        color_lock: req.reference ? cfg.colorLock : 0,
      };
      const timeout = AbortSignal.timeout(cfg.timeoutMs);
      const res = await doFetch(`${base}/restyle`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: req.signal ? AbortSignal.any([req.signal, timeout]) : timeout,
      });
      if (!res.ok) {
        const text = (await res.text().catch(() => "")).slice(0, 300);
        throw new HttpError(`Modal ${res.status}: ${text || res.statusText}`, res.status, parseRetryAfter(res.headers.get("retry-after")));
      }
      const json = (await res.json()) as { image_b64?: string; inference_seconds?: number };
      if (!json.image_b64) throw new HttpError("Modal returned no image", 502);
      return { image: Buffer.from(json.image_b64, "base64"), mime: "image/jpeg", inferenceSeconds: json.inference_seconds };
    },

    async warmup() {
      // Fire and forget, and do not abort early: the request has to stay queued until a
      // container has booted and loaded the model, otherwise Modal may not start one.
      void doFetch(`${base}/health`, { headers, signal: AbortSignal.timeout(20 * 60_000) }).catch(() => undefined);
    },
  };
}

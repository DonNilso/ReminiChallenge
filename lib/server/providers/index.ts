import { createDemoProvider } from "./demo.ts";
import { createModalProvider } from "./modal.ts";
import type { StyleProvider } from "./types.ts";

export function getProvider(env: NodeJS.ProcessEnv = process.env): StyleProvider {
  const url = env.MODAL_ENDPOINT_URL?.trim();
  if (!url || env.DEMO_MODE === "1") {
    return createDemoProvider({ delayMs: env.DEMO_DELAY_MS ? Number(env.DEMO_DELAY_MS) : undefined });
  }
  return createModalProvider({
    endpointUrl: url,
    proxyKey: env.MODAL_PROXY_KEY?.trim(),
    proxySecret: env.MODAL_PROXY_SECRET?.trim(),
    colorLock: env.COLOR_LOCK ? Number(env.COLOR_LOCK) : 0.35,
    // Must end before the serverless function does (300 s on Vercel Hobby). A cold start
    // that takes longer times out here; the browser retries and hits the now-warm container.
    timeoutMs: env.MODAL_TIMEOUT_MS ? Number(env.MODAL_TIMEOUT_MS) : 270_000,
  });
}

export type { StyleProvider } from "./types.ts";

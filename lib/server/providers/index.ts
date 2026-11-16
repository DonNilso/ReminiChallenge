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
    timeoutMs: 10 * 60_000, // first request may include a cold start (model load)
  });
}

export type { StyleProvider } from "./types.ts";

import type { Trend } from "../../trends.ts";

export type StyleRequest = {
  image: Buffer; // photo to restyle (JPEG/PNG, already downscaled client-side)
  reference?: Buffer; // first styled photo of the set, used as style reference
  trend: Trend;
  seed: number;
  signal?: AbortSignal;
};

export type StyleResult = {
  image: Buffer;
  mime: string;
  inferenceSeconds?: number; // GPU time reported by the backend, if any
};

export interface StyleProvider {
  readonly name: "modal" | "demo";
  style(req: StyleRequest): Promise<StyleResult>;
  /** Best-effort: start a container so the first real request skips the cold start. */
  warmup?(): Promise<void>;
}

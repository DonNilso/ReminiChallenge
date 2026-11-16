import sharp, { type OverlayOptions } from "sharp";
import type { DemoGrade } from "../../trends.ts";
import type { StyleProvider, StyleRequest, StyleResult } from "./types.ts";

/**
 * Demo provider: a deterministic colour grade with sharp, so the whole flow can be
 * tried without a GPU. It is NOT the AI model. It only approximates each trend's
 * colour, contrast, grain and vignette, and it ignores the style reference (the same
 * parameters are applied to every photo, which is trivially consistent).
 */
export function createDemoProvider(opts: { delayMs?: number } = {}): StyleProvider {
  const delayMs = opts.delayMs ?? 900;
  return {
    name: "demo",
    async style(req: StyleRequest): Promise<StyleResult> {
      const started = Date.now();
      const image = await applyGrade(req.image, req.trend.demo, req.seed);
      // Simulated latency so the progress UI behaves like the real thing.
      const wait = delayMs * (0.6 + Math.random() * 0.8) - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      return { image, mime: "image/jpeg" };
    },
  };
}

export async function applyGrade(input: Buffer, g: DemoGrade, seed = 1): Promise<Buffer> {
  const offset = 128 * (1 - g.contrast) + g.lift;
  const graded = await sharp(input)
    .rotate() // honour EXIF orientation
    .modulate({ brightness: g.brightness, saturation: g.saturation, hue: g.hue })
    .linear(g.contrast, offset)
    .sharpen({ sigma: 0.8 })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = graded.info;

  const layers: OverlayOptions[] = [];
  if (g.tintAmount > 0) {
    layers.push({
      input: { create: { width, height, channels: 4, background: { r: g.tint[0], g: g.tint[1], b: g.tint[2], alpha: g.tintAmount } } },
      blend: "soft-light",
    });
  }
  if (g.vignette > 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs><radialGradient id="v" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="${g.vignette}"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#v)"/></svg>`;
    layers.push({ input: Buffer.from(svg), blend: "over" });
  }
  if (g.grain > 0) {
    layers.push({ input: grainLayer(width, height, g.grain, seed), raw: { width, height, channels: 4 }, blend: "overlay" });
  }
  return sharp(graded.data).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

/** Mid-grey RGBA noise; with the overlay blend, 128 is neutral. */
function grainLayer(width: number, height: number, amount: number, seed: number): Buffer {
  const buf = Buffer.alloc(width * height * 4);
  let s = seed >>> 0 || 1;
  for (let i = 0; i < width * height; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const n = ((s >>> 0) / 4294967296 - 0.5) * 2 * amount * 2;
    const v = Math.max(0, Math.min(255, Math.round(128 + n)));
    const o = i * 4;
    buf[o] = buf[o + 1] = buf[o + 2] = v;
    buf[o + 3] = 255;
  }
  return buf;
}

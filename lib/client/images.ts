"use client";

export const MAX_EDGE = 1600;
export const MAX_UPLOAD_BYTES = 1.8 * 1024 * 1024;
export const IG_WIDTH = 1080;
export const IG_HEIGHT = 1350;

export type PreparedPhoto = {
  id: string;
  name: string;
  blob: Blob; // JPEG, long edge <= 1600px, EXIF orientation applied
  url: string; // object URL for previews
  width: number;
  height: number;
};

const isHeic = (f: File) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

/** Decode (HEIC too), apply EXIF orientation, downscale to MAX_EDGE, re-encode as JPEG. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  let source: Blob = file;
  if (isHeic(file)) {
    // Safari decodes HEIC natively; elsewhere fall back to a WASM decoder (loaded on demand).
    const native = await createImageBitmap(file).catch(() => null);
    if (native) {
      native.close();
    } else {
      const heic2any = (await import("heic2any")).default;
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
      source = Array.isArray(out) ? out[0] : out;
    }
  }
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  // Stay well under the per-request upload budget (photo + reference < 4.5 MB on Vercel).
  let blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  for (const q of [0.82, 0.72, 0.6]) {
    if (blob.size <= MAX_UPLOAD_BYTES) break;
    blob = await canvasToBlob(canvas, "image/jpeg", q);
  }
  return { id: crypto.randomUUID(), name: file.name, blob, url: URL.createObjectURL(blob), width, height };
}

export type FitMode = "crop" | "pad";

/**
 * Instagram portrait 1080x1350 (4:5).
 * crop: fill the frame, centre-crop the overflow.
 * pad:  fit the whole photo, fill the bars with a blurred, darkened copy of itself.
 */
export async function toInstagramPortrait(src: Blob, mode: FitMode): Promise<Blob> {
  const bmp = await createImageBitmap(src);
  const canvas = makeCanvas(IG_WIDTH, IG_HEIGHT);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  const cover = Math.max(IG_WIDTH / bmp.width, IG_HEIGHT / bmp.height);
  const drawScaled = (s: number) => {
    const w = bmp.width * s;
    const h = bmp.height * s;
    ctx.drawImage(bmp, (IG_WIDTH - w) / 2, (IG_HEIGHT - h) / 2, w, h);
  };
  if (mode === "crop") {
    drawScaled(cover);
  } else {
    ctx.filter = "blur(40px) brightness(0.6)";
    drawScaled(cover * 1.1);
    ctx.filter = "none";
    drawScaled(Math.min(IG_WIDTH / bmp.width, IG_HEIGHT / bmp.height));
  }
  bmp.close();
  return canvasToBlob(canvas, "image/jpeg", 0.92);
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

export function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function canvasToBlob(canvas: AnyCanvas, type: string, quality: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) =>
    (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality),
  );
}

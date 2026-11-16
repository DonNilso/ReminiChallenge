"use client";

import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { IG_HEIGHT, IG_WIDTH } from "./images.ts";

export const VIDEO_SECONDS = 15;
export const CUT_SECONDS = 1.5;
const FPS = 30;
const W = IG_WIDTH;
const H = IG_HEIGHT;

export type VideoResult = { blob: Blob; ext: "mp4" | "webm"; method: "webcodecs" | "mediarecorder" };

/**
 * 15 s, 1080x1350 slideshow: hard cut every 1.5 s, slow Ken Burns zoom/pan on each shot,
 * no audio (users add a trending sound inside Instagram/TikTok).
 * Uses WebCodecs + an MP4 muxer (faster than real time) and falls back to
 * MediaRecorder (real time; MP4 where supported, otherwise WebM).
 */
export async function makeSlideshow(images: Blob[], onProgress?: (p: number) => void): Promise<VideoResult> {
  if (images.length === 0) throw new Error("No images");
  const bitmaps = await Promise.all(images.map((b) => createImageBitmap(b)));
  try {
    const codec = await pickCodec();
    if (codec) return { blob: await encodeWebCodecs(bitmaps, codec, onProgress), ext: "mp4", method: "webcodecs" };
    return await encodeMediaRecorder(bitmaps, onProgress);
  } finally {
    bitmaps.forEach((b) => b.close());
  }
}

/** Which photo and Ken Burns transform to show at time t. */
export function shotAt(t: number, count: number) {
  const shot = Math.min(Math.floor(t / CUT_SECONDS), Math.ceil(VIDEO_SECONDS / CUT_SECONDS) - 1);
  const local = (t - shot * CUT_SECONDS) / CUT_SECONDS; // 0..1 within the shot
  const e = local * local * (3 - 2 * local); // smoothstep
  const zoomIn = shot % 2 === 0;
  const scale = zoomIn ? 1 + 0.1 * e : 1.1 - 0.1 * e;
  const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]][shot % 4];
  return { index: shot % count, scale, dx: dir[0] * 0.03 * (e - 0.5), dy: dir[1] * 0.03 * (e - 0.5) };
}

function drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, bitmaps: ImageBitmap[], t: number) {
  const { index, scale, dx, dy } = shotAt(t, bitmaps.length);
  const bmp = bitmaps[index];
  const cover = Math.max(W / bmp.width, H / bmp.height) * scale;
  const w = bmp.width * cover;
  const h = bmp.height * cover;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(bmp, (W - w) / 2 + dx * W, (H - h) / 2 + dy * H, w, h);
}

async function pickCodec(): Promise<string | null> {
  if (typeof VideoEncoder === "undefined") return null;
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028"]) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS });
      if (supported) return codec;
    } catch {}
  }
  return null;
}

async function encodeWebCodecs(bitmaps: ImageBitmap[], codec: string, onProgress?: (p: number) => void): Promise<Blob> {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: "avc", width: W, height: H, frameRate: FPS }, fastStart: "in-memory" });
  let failure: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (failure = e as Error),
  });
  encoder.configure({ codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS, avc: { format: "avc" } });

  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  const total = VIDEO_SECONDS * FPS;
  for (let i = 0; i < total; i++) {
    if (failure) throw failure;
    drawFrame(ctx, bitmaps, i / FPS);
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    // Keyframe at every cut so scrubbing is snappy.
    encoder.encode(frame, { keyFrame: i % Math.round(CUT_SECONDS * FPS) === 0 });
    frame.close();
    while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 2));
    if (i % 15 === 0) onProgress?.(i / total);
  }
  await encoder.flush();
  encoder.close();
  if (failure) throw failure;
  muxer.finalize();
  onProgress?.(1);
  return new Blob([target.buffer], { type: "video/mp4" });
}

async function encodeMediaRecorder(bitmaps: ImageBitmap[], onProgress?: (p: number) => void): Promise<VideoResult> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const mime = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("This browser cannot record video");
  drawFrame(ctx, bitmaps, 0);
  const stream = canvas.captureStream(FPS);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= VIDEO_SECONDS) return resolve();
      drawFrame(ctx, bitmaps, t);
      onProgress?.(t / VIDEO_SECONDS);
      requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  onProgress?.(1);
  const isMp4 = mime.startsWith("video/mp4");
  return { blob: new Blob(chunks, { type: isMp4 ? "video/mp4" : "video/webm" }), ext: isMp4 ? "mp4" : "webm", method: "mediarecorder" };
}

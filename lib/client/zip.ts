"use client";

import JSZip from "jszip";
import { toInstagramPortrait, type FitMode } from "./images.ts";

export async function buildZip(styled: Blob[], slug: string, fit: FitMode, video?: { blob: Blob; ext: string }): Promise<Blob> {
  const zip = new JSZip();
  const full = zip.folder("styled")!;
  const ig = zip.folder("instagram-1080x1350")!;
  for (let i = 0; i < styled.length; i++) {
    const n = String(i + 1).padStart(2, "0");
    full.file(`${slug}-${n}.jpg`, styled[i]);
    ig.file(`${slug}-${n}-1080x1350.jpg`, await toInstagramPortrait(styled[i], fit));
  }
  if (video) zip.file(`${slug}-slideshow.${video.ext}`, video.blob);
  return zip.generateAsync({ type: "blob", compression: "STORE" }); // JPEGs don't compress further
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

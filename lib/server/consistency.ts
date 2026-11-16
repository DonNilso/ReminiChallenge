import sharp from "sharp";

/** Mean CIE Lab colour of an image (computed on a 64px thumbnail). */
export async function meanLab(input: Buffer): Promise<[number, number, number]> {
  const { data } = await sharp(input).rotate().resize(64, 64, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let L = 0, A = 0, B = 0;
  const n = data.length / 3;
  for (let i = 0; i < data.length; i += 3) {
    const [l, a, b] = srgbToLab(data[i], data[i + 1], data[i + 2]);
    L += l; A += a; B += b;
  }
  return [L / n, A / n, B / n];
}

export function srgbToLab(r8: number, g8: number, b8: number): [number, number, number] {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const r = lin(r8), g = lin(g8), b = lin(b8);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/**
 * "Look spread": average distance (ΔE76) of each photo's mean Lab colour from the set's
 * centroid. Lower = the set reads as one consistent grade. Compare styled vs original.
 * Content still matters (a sunset and a forest never match exactly), so use it as a
 * relative measure, not an absolute score.
 */
export function spread(labs: [number, number, number][]): number {
  if (labs.length === 0) return 0;
  const c = [0, 1, 2].map((k) => labs.reduce((s, v) => s + v[k], 0) / labs.length);
  return labs.reduce((s, v) => s + Math.hypot(v[0] - c[0], v[1] - c[1], v[2] - c[2]), 0) / labs.length;
}

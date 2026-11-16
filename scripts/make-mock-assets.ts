/**
 * Generates the static images used by the host-app mock (public/mock/).
 *   node --experimental-strip-types scripts/make-mock-assets.ts <folder with astronaut.png chelsea.png coffee.png rocket.jpg>
 * Sources: scikit-image sample data (astronaut and rocket: NASA, public domain; chelsea and coffee: CC0).
 * Trend tiles use the demo colour grade, not the AI model.
 */
import path from "node:path";
import sharp from "sharp";
import { applyGrade } from "../lib/server/providers/demo.ts";
import { TRENDS } from "../lib/trends.ts";

const src = process.argv[2];
if (!src) throw new Error("usage: make-mock-assets.ts <source folder>");
const out = "public/mock";
const photos = ["astronaut.png", "chelsea.png", "coffee.png", "rocket.jpg"].map((f) => path.join(src, f));

const portrait = (p: string, w = 480) =>
  sharp(p).resize(w, Math.round(w * 1.25), { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();

// One tile per trend, rotating through the photos.
for (const [i, t] of TRENDS.entries()) {
  const graded = await applyGrade(await portrait(photos[i % photos.length]), t.demo, 7);
  await sharp(graded).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(out, `trend-${t.id}.jpg`));
}

// Studio banner: three different photos, one look.
const golden = TRENDS.find((t) => t.id === "golden-hour")!;
for (const [i, p] of [photos[0], photos[2], photos[1]].entries()) {
  const graded = await applyGrade(await portrait(p, 300), golden.demo, 7);
  await sharp(graded).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(out, `set-${i + 1}.jpg`));
}

// Enhance hero: "before" is low-res and noisy, "after" is the clean original.
const hero = await sharp(photos[0]).resize(720, 900, { fit: "cover", position: "attention" }).toBuffer();
await sharp(hero).sharpen({ sigma: 0.8 }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, "hero-after.jpg"));
const tiny = await sharp(hero).resize(110).toBuffer();
await sharp(tiny).resize(720, 900).blur(1.2).modulate({ saturation: 0.75, brightness: 0.92 }).jpeg({ quality: 30 }).toFile(path.join(out, "hero-before.jpg"));

// Tool tiles and AI Photos grid.
for (const [i, p] of photos.entries()) {
  await sharp(await portrait(p, 360)).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(out, `photo-${i + 1}.jpg`));
}
console.log("done");

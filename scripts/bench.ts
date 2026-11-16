/**
 * Feasibility benchmark: style a folder of photos with every trend (or one) through the
 * same pipeline the app uses, and report time per photo, estimated GPU cost and how
 * consistent the look is across the set.
 *
 *   npm run bench -- ./my-weekend-photos               # all 6 trends
 *   npm run bench -- ./my-weekend-photos golden-hour   # one trend
 *
 * Reads MODAL_ENDPOINT_URL / MODAL_PROXY_KEY / MODAL_PROXY_SECRET from the environment
 * or .env.local (falls back to the demo provider). Writes images and report.json to
 * bench-results/<timestamp>/ (git-ignored).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { runStyleSet, MAX_PHOTOS, type PipelineEvent } from "../lib/shared/pipeline.ts";
import { getProvider } from "../lib/server/providers/index.ts";
import { meanLab, spread } from "../lib/server/consistency.ts";
import { TRENDS } from "../lib/trends.ts";

// Modal H100 list price at the time of writing; check https://modal.com/pricing.
const H100_USD_PER_SECOND = Number(process.env.GPU_USD_PER_SECOND ?? 0.001097);

loadEnvFile(".env.local");
const [dir, only] = process.argv.slice(2);
if (!dir) {
  console.error("usage: npm run bench -- <photo-folder> [trend-id]");
  process.exit(1);
}

const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort()
  .slice(0, MAX_PHOTOS);
if (files.length === 0) throw new Error(`No JPG/PNG/WebP photos in ${dir}`);

// Same preprocessing as the browser: EXIF-rotate, long edge <= 1600, JPEG q90.
const photos = await Promise.all(
  files.map(async (f) => ({
    name: f,
    data: await sharp(path.join(dir, f)).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer(),
  })),
);
const originalSpread = spread(await Promise.all(photos.map((p) => meanLab(p.data))));

const provider = getProvider();
const outDir = path.join("bench-results", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(outDir, { recursive: true });
console.log(`provider=${provider.name} photos=${photos.length} out=${outDir}\n`);

const report: Record<string, unknown>[] = [];
for (const trend of TRENDS.filter((t) => !only || t.id === only)) {
  const done: Extract<PipelineEvent<Buffer>, { status: "done" }>[] = [];
  const errors: string[] = [];
  let totalMs = 0;
  const seed = Math.floor(Math.random() * 2 ** 31);
  await runStyleSet<Buffer, Buffer>({
    photos: photos.map((p) => p.data),
    style: async (image, reference) => {
      const r = await provider.style({ image, reference, trend, seed });
      return { output: r.image, inferenceSeconds: r.inferenceSeconds };
    },
    emit: (e) => {
      if (e.type === "photo" && e.status === "done") {
        done.push(e);
        fs.writeFileSync(path.join(outDir, `${trend.id}-${String(e.index + 1).padStart(2, "0")}-${e.role}.jpg`), e.output);
        process.stdout.write(".");
      } else if (e.type === "photo" && e.status === "retrying") process.stdout.write("r");
      else if (e.type === "photo" && e.status === "error") {
        errors.push(`#${e.index + 1}: ${e.error}`);
        process.stdout.write("x");
      } else if (e.type === "done") totalMs = e.totalMs;
    },
  });
  const styledLabs = await Promise.all(done.map((d) => meanLab(d.output)));
  const gpuSeconds = done.reduce((s, d) => s + (d.inferenceSeconds ?? 0), 0);
  const row = {
    trend: trend.id,
    ok: done.length,
    failed: errors.length,
    wallSeconds: +(totalMs / 1000).toFixed(1),
    avgSecondsPerPhoto: +(done.reduce((s, d) => s + d.ms, 0) / Math.max(1, done.length) / 1000).toFixed(1),
    anchorSeconds: +((done.find((d) => d.role === "anchor")?.ms ?? 0) / 1000).toFixed(1),
    gpuSecondsPerPhoto: +(gpuSeconds / Math.max(1, done.length)).toFixed(2),
    estGpuCostPerSetUSD: +(gpuSeconds * H100_USD_PER_SECOND).toFixed(4),
    retries: done.reduce((s, d) => s + d.attempts - 1, 0),
    lookSpreadOriginal: +originalSpread.toFixed(1),
    lookSpreadStyled: +spread(styledLabs).toFixed(1),
    errors,
  };
  report.push(row);
  console.log(`\n${trend.name.padEnd(16)} ${JSON.stringify(row)}`);
}

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ provider: provider.name, photos: files, report }, null, 2));
console.log(`\nWrote ${path.join(outDir, "report.json")}. Look at the images for face/identity drift; numbers can't catch that.`);

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

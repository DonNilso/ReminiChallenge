# Creator Studio (prototype)

A product-case-study prototype that tests one technical claim:

> An open image-editing model can take 5–10 of a user's **real** photos (say, from a weekend
> trip) and return them enhanced in **one consistent, on-trend look**, ready to post as an
> Instagram carousel.

Trend detection, profiles and scheduling are out of scope. The six trends are hard-coded in
[`data/trends.json`](data/trends.json).

**Status:** the app, the export, the video and the Modal GPU service are built and tested. The
GPU model has **not** been run yet: the sandbox this was built in had no Modal account and no
access to Hugging Face. Everything up to the GPU call is verified (see [Testing](#testing)).
The feasibility numbers that need the real model are marked *to measure*, and the benchmark
script that produces them is ready to run (see [Feasibility notes](#feasibility-notes)).

---

## How it works

```
Browser (Next.js, mobile-first)                    Next.js API route (Node)                 Modal (1x H100 per container)
───────────────────────────────                    ────────────────────────                 ─────────────────────────────
1. pick 3–10 photos (JPG/PNG/HEIC)
   EXIF-rotate + downscale to 1600px  ──POST──▶  /api/style  (max 10 photos)
2. pick a trend                                    photo 1 ─────────────── restyle ──────▶  Qwen-Image-Edit-2511
                                                     (style prompt only)                 ◀──  + Lightning 4-step LoRA
                                                   photos 2..n, 3 at a time ─ restyle ───▶  Picture 1 = photo,
                                                     (same prompt + styled photo 1         Picture 2 = style ref,
                                                      as style reference)              ◀──  then Lab colour-lock
3. progress "3 of 8 done"  ◀──NDJSON stream──      retries on 429/5xx with backoff
4. before/after grid, carousel preview
5. ZIP (full size + 1080x1350) and a 15 s MP4, both built in the browser
```

### Getting a consistent look across the set

1. **One style prompt for every photo.** Each trend in `trends.json` has a detailed prompt
   covering colour grade, white balance, contrast, grain, light and mood.
2. **An anchor photo.** The first photo is styled on its own. Its result is then passed as a
   **style reference image** ("Picture 2") with every other photo, and the prompt says to
   match its grade, contrast, grain and mood without copying any of its content.
3. **A colour lock.** After the model runs, a Reinhard colour transfer in CIE Lab pulls each
   photo's colour statistics 35 % of the way towards the anchor's (`COLOR_LOCK`). It's cheap
   and predictable, and it tightens whatever drift the model leaves behind (measured below).
4. **Hard rules in the prompt** ([`lib/prompt.ts`](lib/prompt.ts)): keep the scene, people,
   faces, identity, bodies, poses and composition; add or remove nothing; only improve
   quality and apply the grade. A negative prompt backs this up when running without
   Lightning. The goal is "real photos, trend aesthetic", **not** AI-generated people.
5. **The same random seed** for every photo in a run.

The anchor is the first photo the user picked, so the upload screen labels it *Sets the look*.
If the anchor fails because of the photo itself (for example an unreadable image), the next
photo becomes the anchor. If it fails because the backend is unavailable, the run stops
instead of slowly failing every photo.

### Why Qwen-Image-Edit-2511 on Modal?

The stack changed from Gemini to self-hosting on Modal. Google's Nano Banana models are
closed and can't run there, so the prototype uses an open-weights editing model:

| | |
|---|---|
| Model | [`Qwen/Qwen-Image-Edit-2511`](https://huggingface.co/Qwen/Qwen-Image-Edit-2511) (20B MMDiT + Qwen2.5-VL encoder, **Apache-2.0**) |
| Pipeline | `diffusers.QwenImageEditPlusPipeline`, checked against the `diffusers==0.43.0` source. It takes several input images and labels them "Picture 1", "Picture 2" in its chat template, which is exactly what the anchor-reference trick needs. |
| Speed-up | [`lightx2v/Qwen-Image-Edit-2511-Lightning`](https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning), file `Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors`: 4 steps instead of 40, CFG 1.0 |
| GPU | 1x H100 80 GB per container (bf16 weights are about 58 GB), at most 3 containers, kept warm 4 min after the last request |
| Output | Same aspect ratio as the input, about 1 MP (for example 896×1120 for 4:5), JPEG q92 |

Alternatives considered: FLUX.2 [klein] 4B is Apache-2.0, multi-reference and much smaller,
so it's cheaper but weaker on identity preservation. FLUX.2 [dev] has a non-commercial
license. MiniMax-H3-Image has a restrictive community license that excludes the EU, UK and US.
The model is one environment variable (`CS_MODEL_ID`), so trying another `QwenImageEditPlus`
checkpoint costs nothing.

---

## Setup

Requirements: Node 20+ (tested on 22). For the AI backend you also need Python 3.11+ and a
[Modal](https://modal.com) account.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:3000, ideally in your browser's phone emulation. Without
`MODAL_ENDPOINT_URL` the app runs in **demo mode** (pink *Demo mode* pill in the header).
A local colour grade made with `sharp` stands in for the model, so you can try the whole
flow: upload, trends, progress, before/after, carousel, ZIP and video. Demo mode is
**not** the AI model, and it ignores the style reference.

### Deploy the GPU service on Modal

1. Install the CLI and log in. This opens a browser to create your Modal token.

   ```bash
   pip install modal
   ```

   ```bash
   modal setup
   ```

2. Deploy. The first deploy builds the container image (a few minutes). The first request
   then downloads about 58 GB of weights into a Modal Volume (`creator-studio-hf-cache`),
   which takes several minutes once. Later cold starts read from the Volume.

   ```bash
   modal deploy modal_app/restyle.py
   ```

   It prints a URL like `https://<workspace>--creator-studio-restyler-web.modal.run`.

3. Create a proxy-auth token. The endpoint is deployed with `requires_proxy_auth=True`, so
   it rejects calls without one.

   ```bash
   modal workspace proxy-tokens create
   ```

4. Put the URL (no trailing slash), the `wk-…` key and the `ws-…` secret into `.env.local`
   as `MODAL_ENDPOINT_URL`, `MODAL_PROXY_KEY` and `MODAL_PROXY_SECRET`, then restart
   `npm run dev`. The header pill now reads *AI · Modal*.

Optional: a one-photo smoke test straight against Modal.

```bash
modal run modal_app/restyle.py --image-path some-photo.jpg
```

Deploy-time switches (environment variables when running `modal deploy`): `CS_GPU`
(default `H100`), `CS_USE_LIGHTNING=0` (full 40-step model, about 10x slower),
`CS_MODEL_ID`, `CS_LORA_REPO`, `CS_LORA_FILE`. App-side: `COLOR_LOCK` (0–1, default 0.35),
`DEMO_MODE=1`.

### Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | 15 unit tests: pipeline order and anchor logic, concurrency limit, retries, Modal request shape and auth, demo grade, consistency metric |
| `npm run lint` | `tsc --noEmit` |
| `npm run bench -- <folder> [trend]` | Feasibility benchmark (below) |
| `pytest modal_app` | Offline tests for the Python helpers: output sizing, decoding, Lab conversion, colour lock |

---

## Rough cost per run

Modal bills GPU-seconds while a container is up. The H100 list price used here is
**$3.95/h (about $0.0011/s)**; check [modal.com/pricing](https://modal.com/pricing).

| Component | Estimate | Notes |
|---|---|---|
| Inference, 4 steps at 1 MP | about 3–6 s per photo, **so about $0.004–0.007 per photo** | Estimate from published Lightning numbers; *to measure* with `npm run bench` |
| One set of 8 photos | **about $0.03–0.06** of GPU time | Photo 1 runs alone, then 3 in parallel |
| Cold start (load 58 GB from the Volume) | about 1–2 min, so about $0.07–0.13 per container | Paid once per container while traffic is steady |
| Warm idle after the run | up to 4 min x 3 containers, so **up to about $0.80** | Dominates cost at prototype traffic; lower `scaledown_window` / `max_containers` to trade latency for cost |

In short, at steady traffic the marginal cost is under a cent per photo. For a single demo
run after a quiet period, most of the bill is cold start plus idle time, roughly
$0.10–$0.90 per run.

---

## Known limitations

- **The model hasn't been run end to end yet** (no GPU account in the build sandbox). The
  Modal app's helpers are unit-tested and its definition imports cleanly with `modal==1.6.4`,
  but the actual inference call is untested, and so are the pinned versions (`torch 2.15`,
  `transformers 5.23`, `diffusers 0.43`).
- **About 1 MP output.** The model is trained around 1 MP, so a 4:5 output is about
  896×1120 and is upscaled slightly for the 1080×1350 export. A production version would
  run a super-resolution pass, which is Remini's core product anyway.
- **Sizes are multiples of 32**, so the output aspect ratio can be off from the original by
  under 2 %.
- **The Instagram export is a centre crop** (or fit-with-blurred-bars). There's no
  subject-aware cropping, so off-centre people can get cut.
- **The anchor is always the first photo.** A night shot as photo 1 will steer the whole
  set. Picking the most "typical" photo as anchor would be better.
- **HEIC:** decoded natively in Safari, elsewhere via the `heic2any` WASM decoder (loaded on
  demand). That fallback isn't covered by the automated test, which had no HEIC sample.
- **Video:** made in the browser with WebCodecs plus an MP4 muxer (H.264, 1080×1350, 30 fps,
  15 s, cuts every 1.5 s, Ken Burns, no audio). Browsers without WebCodecs H.264 fall back to
  real-time `MediaRecorder`, which gives MP4 in Safari and WebM in Firefox.
- **Request size:** all photos go in one multipart request (about 3–6 MB for 10 photos).
  Fine locally; behind a hosting provider with a body limit (for example 4.5 MB on Vercel
  functions) you would upload per photo or to object storage first.
- **No auth or rate limiting** on the Next.js API; anyone who can reach it can spend your
  GPU budget.
- **Privacy:** photos live only in memory (browser, API route, Modal container) for the
  duration of the request. Nothing is written to disk or logged, apart from model weights in
  the Modal Volume.

---

## Feasibility notes

### Measured so far (no GPU)

| What | Result |
|---|---|
| End-to-end flow in Chromium on an iPhone 13 viewport (demo provider) | Upload 5 photos, then trend, progress ("1 of 5 … 5 of 5 done"), before/after toggle, carousel (fill and fit), ZIP, MP4: all pass |
| Real Modal client path, against a stand-in server that speaks the same API | Proxy-auth headers sent; two `429`s retried after `Retry-After`; anchor sent with no reference; photos 2–4 sent with reference, `color_lock=0.35` and the same seed |
| Export | ZIP holds `styled/*.jpg` (full size) and `instagram-1080x1350/*.jpg` (all exactly 1080×1350), plus the video if one was made |
| Video | H.264 High profile, 1080×1350, 30 fps, **15.000 s, 450 frames**, keyframes at 0, 1.5, 3, … 13.5 s. Rendering in the browser takes a few seconds on a laptop |
| Does a fixed filter make a set consistent? | **Barely.** Applying the same grade to 5 unrelated photos changed the "look spread" (mean ΔE of each photo's average Lab colour from the set average) from 16.3 to between 11.9 and 21.2, depending on the trend. Y2K flash *increased* spread. A preset alone doesn't unify a set, which is why the anchor-reference approach is needed. |
| Colour lock on top (deterministic, measured on the same outputs) | Cut look spread by **about 28 % at strength 0.35** and **about 45 % at 0.6** for all six trends (for example Golden hour 16.5 to 11.6 to 8.4). 0.35 is the default because higher values start to wash out real differences between scenes, such as a sunset next to a daytime shot. |

### To measure with the real model

Put 5–10 photos from one trip in a folder (`npm run bench` reads JPG, PNG and WebP; it
doesn't decode HEIC, so convert those first), deploy the Modal app, then run:

```bash
npm run bench -- ./my-weekend
```

It runs all six trends through the same pipeline the app uses and writes the images plus
`bench-results/<time>/report.json`. Fill in this table from it:

| Metric | Where it comes from | Result |
|---|---|---|
| Average time per photo (warm) | `avgSecondsPerPhoto`, `gpuSecondsPerPhoto` | *to measure* (estimate 3–6 s) |
| Anchor time, including cold start | `anchorSeconds` on the first trend | *to measure* (estimate 1–3 min cold) |
| Cost per set | `estGpuCostPerSetUSD` (GPU time only) | *to measure* |
| Consistency | `lookSpreadStyled` vs `lookSpreadOriginal`; also look at the set side by side | *to measure* |
| Faces and identity changed? | Manual: compare before/after at 100 % on every face | *to measure* |
| Objects added or removed, text rewritten? | Manual | *to measure* |
| Crops and framing shifted? | Manual: toggle before/after in the app | *to measure* |

Failure cases to look for, based on how this model class behaves. These are **expected,
not yet observed**:

- **Subtle face drift**, more likely at 4 steps than 40, and on small or distant faces:
  slightly different eyes, teeth or skin texture. This is the most important thing to check
  for this product. If it shows up, try `CS_USE_LIGHTNING=0` or 8 steps before anything else.
- **Relighting trends overreach.** *Golden hour* and *Y2K flash* ask for new light, not just
  a grade. The model may move shadows or add flash highlights that weren't physically there.
- **Rewritten text**: signs, logos, jersey numbers.
- **Grain** is generated, not simulated film, so it can look smeared or uneven between photos.
- **The reference leaks content**: an element of the anchor photo appears in another photo.
  The prompt guards against it, but it's a known multi-image failure mode.

### How a production version would cut cost

1. **Preview cheaply, finish later.** Generate previews at 512 px (about 0.25 MP, so about 4x
   fewer pixels and roughly 3–4x cheaper per photo). Run full resolution only for users who
   start a trial or subscribe, and only for the photos they actually export.
2. **Use the model once per set and a LUT for the rest.** Fit a 3D colour LUT from the
   anchor's before/after pair and apply it to the remaining photos at near-zero cost. Use the
   model only for the anchor and for photos that need real enhancement (noise, blur, low
   light). This is the biggest lever, and the colour-lock results above suggest
   deterministic colour work carries much of the consistency.
3. **Cache the anchor.** When the user switches trends, only re-run the anchor until they
   commit to a trend.
4. **Cheaper serving:** FP8 weights (fit on a cheaper 48 GB GPU and run faster), GPU memory
   snapshots to cut cold starts, and batching photos from many users on fewer warm
   containers instead of each run keeping 3 containers idle.
5. **Smaller model for easy cases:** route plain grade-only trends (*Clean & minimal*,
   *Candid*) to a 4B model (for example FLUX.2 [klein]), and keep the 20B model for
   relighting trends.

---

## File structure

```
app/
  page.tsx                  server component, passes public trend fields to the client
  layout.tsx, globals.css   Remini-style dark UI (Outfit, #1C1C1E cards, white pills, #D92D50 badges)
  api/style/route.ts        POST multipart photos and trendId, returns an NDJSON progress stream
  api/warmup/route.ts       GET: active backend; POST: pre-warm a GPU container on first upload
components/                 Studio (state machine), UploadStep, TrendStep, ProcessingStep, ResultsStep
data/trends.json            the 6 trends: name, description, rising/steady, style prompt, demo grade
lib/
  prompt.ts                 identity-preserving prompt; Picture 1 / Picture 2 roles
  trends.ts
  server/pipeline.ts        anchor then reference strategy, concurrency 3, retries, 10-photo cap
  server/retry.ts           backoff with jitter, Retry-After
  server/concurrency.ts
  server/consistency.ts     Lab "look spread" metric for the benchmark
  server/providers/         modal.ts (HTTP client), demo.ts (sharp grade), index.ts (choose)
  client/images.ts          HEIC, EXIF, 1600 px downscale, 1080x1350 crop/pad
  client/zip.ts             JSZip export
  client/video.ts           15 s Ken Burns slideshow, WebCodecs to MP4 (MediaRecorder fallback)
modal_app/restyle.py        Modal GPU service (Qwen-Image-Edit-2511 + Lightning, colour lock)
modal_app/test_restyle.py   offline tests for its helpers
scripts/bench.ts            feasibility benchmark
tests/                      node:test unit tests
```

## Testing

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

```bash
pip install modal pillow numpy pytest
```

```bash
pytest modal_app
```

Beyond those, the build was checked with a scripted Playwright run on an iPhone 13
viewport, in demo mode and against a stand-in Modal server (results in the feasibility
table above). That run used a few public-domain sample photos from the scikit-image test
data, which aren't committed.

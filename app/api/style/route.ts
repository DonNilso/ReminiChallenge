import { getTrend } from "@/lib/trends.ts";
import { getProvider } from "@/lib/server/providers/index.ts";
import { MAX_PHOTOS, runStyleSet, errorMessage, type PhotoInput, type PipelineEvent } from "@/lib/server/pipeline.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * POST multipart/form-data: trendId, photos (1..10 image files, already downscaled by the client).
 * Responds with NDJSON, one PipelineEvent per line, so the client can show per-photo progress.
 * Photos stay in memory for the duration of the request and are never written anywhere.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const trend = getTrend(String(form.get("trendId") ?? ""));
  if (!trend) return Response.json({ error: "Unknown trend" }, { status: 400 });

  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) return Response.json({ error: "No photos" }, { status: 400 });
  if (files.length > MAX_PHOTOS) return Response.json({ error: `At most ${MAX_PHOTOS} photos per run` }, { status: 400 });
  for (const f of files) {
    if (!f.type.startsWith("image/")) return Response.json({ error: `${f.name} is not an image` }, { status: 400 });
    if (f.size > MAX_FILE_BYTES) return Response.json({ error: `${f.name} is larger than 8 MB` }, { status: 413 });
  }
  const photos: PhotoInput[] = await Promise.all(files.map(async (f) => ({ name: f.name, data: Buffer.from(await f.arrayBuffer()) })));

  const provider = getProvider();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: PipelineEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          // client went away; keep going quietly, the signal will stop new work
        }
      };
      try {
        await runStyleSet({ provider, trend, photos, emit, signal: req.signal });
      } catch (err) {
        emit({ type: "photo", index: -1, status: "error", error: errorMessage(err) });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

import { getProvider } from "@/lib/server/providers/index.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which backend is active ("modal" or "demo"). */
export async function GET() {
  return Response.json({ provider: getProvider().name });
}

/** Pre-warm a GPU container (called when the user starts adding photos). */
export async function POST() {
  const provider = getProvider();
  await provider.warmup?.();
  return Response.json({ provider: provider.name, warming: Boolean(provider.warmup) });
}

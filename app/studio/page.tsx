import Studio from "@/components/Studio.tsx";
import { TRENDS } from "@/lib/trends.ts";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { trend } = await searchParams;
  // Only the public fields go to the client; style prompts stay on the server.
  const trends = TRENDS.map(({ id, name, description, status, swatch }) => ({ id, name, description, status, swatch }));
  const initialTrendId = typeof trend === "string" && trends.some((t) => t.id === trend) ? trend : null;
  return <Studio trends={trends} initialTrendId={initialTrendId} />;
}

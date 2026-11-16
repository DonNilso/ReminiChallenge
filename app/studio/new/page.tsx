import Studio from "@/components/Studio.tsx";
import { publicTrends } from "@/lib/trends.ts";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { trend } = await searchParams;
  const trends = publicTrends(); // style prompts stay on the server
  const initialTrendId = typeof trend === "string" && trends.some((t) => t.id === trend) ? trend : null;
  return <Studio trends={trends} initialTrendId={initialTrendId} />;
}

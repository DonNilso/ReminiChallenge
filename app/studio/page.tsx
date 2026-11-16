import StudioHome from "@/components/StudioHome.tsx";
import { publicTrends } from "@/lib/trends.ts";

export default function StudioHomePage() {
  const trends = publicTrends(); // style prompts stay on the server
  return <StudioHome trends={trends} />;
}

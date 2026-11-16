import HomeScreen from "@/components/host/HomeScreen.tsx";
import { publicTrends } from "@/lib/trends.ts";

export default function Home() {
  const trends = publicTrends(); // style prompts stay on the server
  return <HomeScreen trends={trends} />;
}

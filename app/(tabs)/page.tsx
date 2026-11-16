import HomeScreen from "@/components/host/HomeScreen.tsx";
import { TRENDS } from "@/lib/trends.ts";

export default function Home() {
  const trends = TRENDS.map(({ id, name, description, status, swatch }) => ({ id, name, description, status, swatch }));
  return <HomeScreen trends={trends} />;
}

import StudioHome from "@/components/StudioHome.tsx";
import { TRENDS } from "@/lib/trends.ts";

export default function StudioHomePage() {
  const trends = TRENDS.map(({ id, name, description, status, swatch }) => ({ id, name, description, status, swatch }));
  return <StudioHome trends={trends} />;
}

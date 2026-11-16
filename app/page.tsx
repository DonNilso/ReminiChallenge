import Studio from "@/components/Studio.tsx";
import { TRENDS } from "@/lib/trends.ts";

export default function Page() {
  // Only the public fields go to the client; style prompts stay on the server.
  const trends = TRENDS.map(({ id, name, description, status, swatch }) => ({ id, name, description, status, swatch }));
  return <Studio trends={trends} />;
}

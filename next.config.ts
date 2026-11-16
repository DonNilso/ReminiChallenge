import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp is only used by the demo provider on the server.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;

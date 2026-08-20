import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows local subdomain testing, e.g. http://dokon.localhost:3000
  allowedDevOrigins: ["*.localhost"],
};

export default nextConfig;

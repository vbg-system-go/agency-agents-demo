import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow any device on the local network to access the dev server.
  // '172.20.10.*' covers the observed subnet; add more ranges if needed.
  allowedDevOrigins: ['localhost', '127.0.0.1', '172.20.10.*', '192.168.*', '10.*'],
};

export default nextConfig;

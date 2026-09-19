import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/team/:path*",
        destination: "/api/teams/:path*",
      },
    ];
  },
};

export default nextConfig;
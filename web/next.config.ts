import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const privateRobotsHeaders = [
  ...securityHeaders,
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/login",
        headers: privateRobotsHeaders,
      },
      {
        source: "/auth/:path*",
        headers: privateRobotsHeaders,
      },
      {
        source: "/create",
        headers: privateRobotsHeaders,
      },
      {
        source: "/dashboard/:path*",
        headers: privateRobotsHeaders,
      },
      {
        source: "/admin/:path*",
        headers: privateRobotsHeaders,
      },
      {
        source: "/settings/:path*",
        headers: privateRobotsHeaders,
      },
    ];
  },
};

export default nextConfig;

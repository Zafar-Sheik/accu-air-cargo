import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: process.env.R2_PUBLIC_URL
      ? [new URL(process.env.R2_PUBLIC_URL.replace(/\/$/, "") + "/**")]
      : [],
  },
  allowedDevOrigins: ["terminal.local"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "X-Frame-Options",
            value:
              process.env.NODE_ENV === "production" ? "DENY" : "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;

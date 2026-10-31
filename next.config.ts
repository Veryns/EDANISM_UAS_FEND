import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt"],
  outputFileTracingIncludes: {
    "/admin": ["./private/**/*"],
    "/admin/login": ["./private/**/*"],
    "/admin/route": ["./private/**/*"],
    "/admin/login/route": ["./private/**/*"],
  },
};

export default nextConfig;
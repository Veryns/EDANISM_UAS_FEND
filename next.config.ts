import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt"],
  outputFileTracingIncludes: {
    "/admin": ["./private/**/*"],
    "/admin/login": ["./private/**/*"],
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const basePathEnv = process.env.NEXT_BASE_PATH?.trim();

const nextConfig: NextConfig = {
  output: "standalone",
  basePath:
    basePathEnv && basePathEnv !== "/" ? (basePathEnv.startsWith("/") ? basePathEnv : `/${basePathEnv}`) : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

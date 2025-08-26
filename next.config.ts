import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Skip type checking and linting during build (for Docker)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Optimize for faster navigation
  experimental: {
    // Prefetch pages on hover for instant navigation
    optimisticClientCache: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keeps console.error/warn)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

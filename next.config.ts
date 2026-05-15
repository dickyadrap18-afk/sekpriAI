import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Fix Turbopack workspace root warning — point to this project's directory
  // (prevents confusion with C:\Users\Pc\package-lock.json)
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Optimize for faster navigation
  experimental: {
    optimisticClientCache: true,
  },

  // Compiler optimizations
  compiler: {
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

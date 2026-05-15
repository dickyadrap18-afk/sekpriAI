import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Fix Turbopack workspace root warning
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Prevent large client-only packages from being bundled on the server
  serverExternalPackages: [
    "three",
    "imapflow",
    "mailparser",
    "nodemailer",
    "mammoth",
    "pdf-parse",
  ],

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

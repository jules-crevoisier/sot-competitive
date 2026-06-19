import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixe la racine du workspace (un pnpm-lock.yaml parasite traîne dans le home).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixe la racine du workspace (un pnpm-lock.yaml parasite traîne dans le home).
  turbopack: {
    root: path.join(__dirname),
  },
  // tesseract.js utilise des workers Node : on l'exclut du bundling serveur
  // sinon le chemin de son worker-script casse (require natif à la place).
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;

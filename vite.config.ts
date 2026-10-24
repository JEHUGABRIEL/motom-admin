import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En développement, les appels /api sont relayés vers l'API du site public
// (même origine qu'en production via la réécriture Vercel). Surchargeable avec
// VITE_API_TARGET pour viser un déploiement de préproduction.
const apiTarget = process.env.VITE_API_TARGET || "https://motom-rca.vercel.app";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "icons", test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            { name: "vendor", test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@gh0st/core": path.resolve(__dirname, "../../packages/core/src"),
      "@gh0st/security": path.resolve(__dirname, "../../packages/security/src"),
      "@gh0st/storage": path.resolve(__dirname, "../../packages/storage/src"),
      "@gh0st/files": path.resolve(__dirname, "../../packages/files/src"),
      "@gh0st/xai": path.resolve(__dirname, "../../packages/xai/src"),
      "@gh0st/ui": path.resolve(__dirname, "../../packages/ui/dist/index.es.js")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "zustand"],
          xai: ["@gh0st/xai"],
          security: ["@gh0st/security"],
          storage: ["@gh0st/storage"],
          files: ["@gh0st/files"]
        }
      }
    }
  },
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ["VITE_", "TAURI_"]
});
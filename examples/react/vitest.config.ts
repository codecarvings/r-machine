import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve R-Machine packages to their source files in the monorepo so
    // mockPlug sees a single plug instance (no rebuild needed after editing
    // r-machine packages).
    conditions: ["@r-machine/source"],
    // Mirror the tsconfig "@/*" -> "./src/*" path mapping.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
}) as ViteUserConfig;

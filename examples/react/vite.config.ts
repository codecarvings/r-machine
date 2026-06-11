/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { rMachineHmr } from "./src/r-machine/vite-plugin-r-machine-hmr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), rMachineHmr()],
  build: {
    // Shiki's Oniguruma WASM engine is ~620kB (syntax highlighter).
    // Raise the limit to silence the otherwise spurious size warning.
    chunkSizeWarningLimit: 700,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: true,
  },
});

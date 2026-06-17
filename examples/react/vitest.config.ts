import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
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
    // R-Machine packages must be inlined so Vite — not Node's raw ESM loader —
    // resolves their imports and gives mockPlug a single plug instance; and so
    // `verifyResourceAtlas` loads setup.ts through the bundler graph, which a
    // setup file relies on (extensionless TS imports, `import.meta.glob`, etc.).
    server: { deps: { inline: ["@r-machine/testing"] } },
  },
}) as ViteUserConfig;

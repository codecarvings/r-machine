import { fileURLToPath } from "node:url";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve R-Machine packages to their source files in the monorepo
    // (no rebuild needed after editing r-machine packages).
    conditions: ["@r-machine/source"],
    // Mirror the tsconfig "@/*" -> "./src/*" path mapping (Vitest does not
    // read tsconfig paths by default).
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
}) as ViteUserConfig;

import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve R-Machine packages to their source files in the monorepo
    // (no rebuild needed after editing r-machine packages).
    conditions: ["@r-machine/source"],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
}) as ViteUserConfig;

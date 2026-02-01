import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
}) as ViteUserConfig;

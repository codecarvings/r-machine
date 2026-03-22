import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      reporter: ["text", "html"],
      include: ["r-machine/src/**", "r-machine-react/src/**", "r-machine-next/src/**"], // No duplicates from coverage report, example "r-machine/src/locale" and "r-machine/locale"
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
}) as ViteUserConfig;

import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["@r-machine/source"],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    watch: false,
    isolate: true,
    typecheck: {
      include: ["tests/**/*.test-d.{ts,tsx}"],
      enabled: true,
      ignoreSourceErrors: false,
      checker: "tsc",
      tsconfig: "./tsconfig.json",
    },
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
    },
    silent: true,
  },
}) as ViteUserConfig;

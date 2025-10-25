import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type ViteUserConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ["@r-machine/source"],
  },
  test: {
    watch: false,
    isolate: true,
    typecheck: {
      include: ["**/*.test-d.ts"],
      enabled: true,
      ignoreSourceErrors: false,
      checker: "tsc",
      tsconfig: "./tsconfig.json",
    },
    silent: true,
  },
}) as ViteUserConfig;

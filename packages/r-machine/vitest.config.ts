import path from "node:path";
import { defineProject, mergeConfig, type ViteUserConfig } from "vitest/config";
import baseConfig from "../../configs/vitest.base.js";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      typecheck: {
        tsconfig: "./tsconfig.test.json",
      },
    },
    resolve: {
      alias: [
        { find: /^#r-machine$/, replacement: path.resolve(import.meta.dirname, "./src/lib/index.ts") },
        { find: /^#r-machine\/(.*)$/, replacement: path.resolve(import.meta.dirname, "./src/$1/index.ts") },
      ],
    },
  })
) as ViteUserConfig;

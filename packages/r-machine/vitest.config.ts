import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject, mergeConfig, type ViteUserConfig } from "vitest/config";
import baseConfig from "../../configs/vitest.base.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        { find: /^#r-machine$/, replacement: path.resolve(__dirname, "./src/index.ts") },
        { find: /^#r-machine\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1.ts") },
      ],
    },
  })
) as ViteUserConfig;

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
        // ignoreSourceErrors: true,
      },
    },
    resolve: {
      alias: [
        { find: /^#r-machine\/next$/, replacement: path.resolve(__dirname, "./src/lib/index.ts") },
        { find: /^#r-machine\/next\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1/index.ts") },
      ],
    },
  })
) as ViteUserConfig;

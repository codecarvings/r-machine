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
  })
) as ViteUserConfig;

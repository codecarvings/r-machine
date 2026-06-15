import { defineProject, mergeConfig, type ViteUserConfig } from "vitest/config";
import baseConfig from "../../configs/vitest.base.js";

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      environment: "node",
      typecheck: {
        tsconfig: "./tsconfig.json",
      },
    },
  })
) as ViteUserConfig;

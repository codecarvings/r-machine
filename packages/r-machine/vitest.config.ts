import { defineProject, mergeConfig, ViteUserConfig } from "vitest/config";
import rootConfig from "../../vitest.root.js";

export default mergeConfig(
  rootConfig,
  defineProject({
    test: {
      typecheck: {
        tsconfig: "./tsconfig.test.json",
      },
    },
  })
) as ViteUserConfig;

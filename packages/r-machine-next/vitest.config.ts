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
        { find: /^#r-machine\/next$/, replacement: path.resolve(import.meta.dirname, "./src/lib/index.ts") },
        { find: /^#r-machine\/next\/(.*)$/, replacement: path.resolve(import.meta.dirname, "./src/$1/index.ts") },

        // Force sibling-package imports to resolve to source. Without these,
        // top-level `r-machine/*` imports go through node's exports field and
        // pick the built `.js` outputs, which drift from source between edits
        // and rebuilds — tests would silently run against stale code. The
        // `@r-machine/source` condition above should handle this but does not
        // reliably propagate when `defineProject` is mergeConfig'd with the
        // base. Order matters — most specific first.
        { find: /^r-machine\/core$/, replacement: path.resolve(import.meta.dirname, "../r-machine/src/core/index.ts") },
        {
          find: /^r-machine\/locale$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine/src/locale/index.ts"),
        },
        {
          find: /^r-machine\/strategy$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine/src/strategy/index.ts"),
        },
        {
          find: /^r-machine\/errors$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine/src/errors/index.ts"),
        },
        { find: /^r-machine$/, replacement: path.resolve(import.meta.dirname, "../r-machine/src/lib/index.ts") },

        {
          find: /^@r-machine\/react\/core$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine-react/src/core/index.ts"),
        },
        {
          find: /^@r-machine\/react\/errors$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine-react/src/errors/index.ts"),
        },
        {
          find: /^@r-machine\/react\/utils$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine-react/src/utils/index.ts"),
        },
        {
          find: /^@r-machine\/react$/,
          replacement: path.resolve(import.meta.dirname, "../r-machine-react/src/lib/index.ts"),
        },
      ],
    },
  })
) as ViteUserConfig;

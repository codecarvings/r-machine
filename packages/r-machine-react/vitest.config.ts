import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject, mergeConfig, type ViteUserConfig } from "vitest/config";
import baseConfig from "../../configs/vitest.base.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WP: the strategy/toolset suites under tests/core + all of tests/lib are
// stale against the post-DI-refactor API and stay parked (excluded) until
// rewritten. Excluded per-file (by stale-prefix) rather than whole-dir so
// freshly-written tests/core unit suites (vertex-frame, scope-context,
// react-plug, …) run under the active config.
// Exclusion also mirrored in tsconfig.test.json.
const excludePatterns = [
  "**/tests/lib/**",
  "**/tests/core/index.test-d.*",
  "**/tests/core/react-bare-*",
  "**/tests/core/react-standard*",
  "**/tests/core/react-strategy-core.*",
  "**/tests/core/react-toolset.*",
];

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      environment: "jsdom",
      typecheck: {
        tsconfig: "./tsconfig.test.json",
        exclude: excludePatterns,
      },
      exclude: excludePatterns,
    },
    resolve: {
      alias: [
        { find: /^#r-machine\/react$/, replacement: path.resolve(__dirname, "./src/lib/index.ts") },
        { find: /^#r-machine\/react\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1/index.ts") },

        // Force sibling-package imports to resolve to source. Without these,
        // top-level `r-machine/*` imports go through node's exports field and
        // pick the built `.js` outputs, which drift from source between edits
        // and rebuilds — tests would silently run against stale code. The
        // `@r-machine/source` condition above should handle this but does not
        // reliably propagate when `defineProject` is mergeConfig'd with the
        // base. Order matters — most specific first.
        { find: /^r-machine\/core$/, replacement: path.resolve(__dirname, "../r-machine/src/core/index.ts") },
        { find: /^r-machine\/locale$/, replacement: path.resolve(__dirname, "../r-machine/src/locale/index.ts") },
        { find: /^r-machine\/strategy$/, replacement: path.resolve(__dirname, "../r-machine/src/strategy/index.ts") },
        { find: /^r-machine\/errors$/, replacement: path.resolve(__dirname, "../r-machine/src/errors/index.ts") },
        { find: /^r-machine$/, replacement: path.resolve(__dirname, "../r-machine/src/lib/index.ts") },
      ],
    },
  })
) as ViteUserConfig;

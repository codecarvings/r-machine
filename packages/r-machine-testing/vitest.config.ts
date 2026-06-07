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
      environment: "node",
      typecheck: {
        tsconfig: "./tsconfig.test.json",
      },
    },
    resolve: {
      conditions: ["@r-machine/source"],
      alias: [
        // `@r-machine/source` condition is unreliable in vitest (see below), so
        // pin this package's own `#r-machine/testing/*` subpaths to source too —
        // else a newly-added error code resolves to the STALE built `errors/`.
        { find: /^#r-machine\/testing\/errors$/, replacement: path.resolve(__dirname, "./src/errors/index.ts") },
        { find: /^#r-machine\/testing$/, replacement: path.resolve(__dirname, "./src/lib/index.ts") },

        // Force `r-machine`'s OWN internal subpath imports (`#r-machine/*`) to
        // source too. The `r-machine` alias below routes the entry to `src/lib`,
        // but `src/lib` reaches core/errors/etc. via these private subpaths,
        // whose `default` condition points at the built `.js` outputs. Left
        // unaliased, a plug created by RMachine resolves through the BUILT core
        // while `@r-machine/testing` (mockPlug, getPlugResolve) resolves through
        // the SOURCE core — two `plug.ts` module instances, mismatched private
        // Symbols, and `getPlugResolve` reads `undefined`. Pinning them to
        // source collapses both onto a single core instance.
        { find: /^#r-machine\/core$/, replacement: path.resolve(__dirname, "../r-machine/src/core/index.ts") },
        { find: /^#r-machine\/errors$/, replacement: path.resolve(__dirname, "../r-machine/src/errors/index.ts") },
        { find: /^#r-machine\/locale$/, replacement: path.resolve(__dirname, "../r-machine/src/locale/index.ts") },
        {
          find: /^#r-machine\/strategy\/web$/,
          replacement: path.resolve(__dirname, "../r-machine/src/strategy/web/index.ts"),
        },
        { find: /^#r-machine\/strategy$/, replacement: path.resolve(__dirname, "../r-machine/src/strategy/index.ts") },
        { find: /^#r-machine$/, replacement: path.resolve(__dirname, "../r-machine/src/lib/index.ts") },

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

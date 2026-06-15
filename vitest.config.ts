import { defineConfig, type ViteUserConfig } from "vitest/config";

// Lock a namespace at full coverage once its test-overhaul task drives it to
// 100% on every metric. See CONTRIBUTING.md → "Testing" for the workflow.
const FULL = { statements: 100, branches: 100, functions: 100, lines: 100 } as const;

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      reporter: ["text", "html"],
      // All five packages are in scope. No duplicates from the coverage report,
      // e.g. "r-machine/src/locale" vs "r-machine/locale".
      include: [
        "r-machine/src/**",
        "r-machine-react/src/**",
        "r-machine-next/src/**",
        "r-machine-testing/src/**",
        "rforge/src/**",
      ],
      // Coverage ratchet. The global gate is intentionally OFF during the test
      // overhaul so not-yet-finished namespaces don't red CI. As each namespace
      // is driven to 100% in its task, add a per-glob entry below — locking it so
      // it can never regress. When every namespace is done, restore a global 100
      // backstop here. (`100`-only-on-all-metrics files are hidden by the text
      // reporter; use json-summary to read a namespace's true numbers.)
      thresholds: {
        "r-machine/src/errors/**": FULL,
        "r-machine/src/locale/**": FULL,
        "r-machine/src/strategy/**": FULL,
        "r-machine/src/core/**": FULL,
        "r-machine/src/lib/**": FULL,
        "r-machine-react/src/core/**": FULL,
        "r-machine-react/src/errors/**": FULL,
        "r-machine-react/src/lib/**": FULL,
        "r-machine-react/src/utils/**": FULL,
        "r-machine-next/src/app/**": FULL,
        "r-machine-next/src/core/**": FULL,
        "r-machine-next/src/dev/**": FULL,
        "r-machine-next/src/errors/**": FULL,
        "r-machine-next/src/internal/**": FULL,
        "r-machine-next/src/lib/**": FULL,
        "r-machine-testing/src/errors/**": FULL,
        "r-machine-testing/src/lib/**": FULL,
        "rforge/src/**": FULL,
      },
    },
  },
}) as ViteUserConfig;

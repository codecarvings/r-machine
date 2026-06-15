import { defineConfig, type ViteUserConfig } from "vitest/config";

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
      // Global 100% gate. The test overhaul drove every namespace across all five
      // packages to full coverage (bottom-up, one namespace per task), each
      // justified `/* v8 ignore */` defended in review. `all: true` instruments
      // every included source file — not just the ones a test imports — so a new
      // file with no test fails CI at 0% instead of slipping through. The earlier
      // per-glob ratchet that ramped this up is now subsumed by this single gate.
      // (`100`-on-all-metrics files are hidden by the text reporter; use
      // json-summary to read true numbers.)
      all: true,
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
}) as ViteUserConfig;

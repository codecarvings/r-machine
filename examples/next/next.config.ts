import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // React Compiler is discouraged in R-Machine projects: R-Machine reactivity is
  // already read-driven (fine-grained re-render gating + cell-layer memoization),
  // so the compiler brings little benefit and adds per-re-render wrapping overhead.
  // If you must enable it (e.g. a mixed codebase), set it `true` here AND set
  // `reactCompiler: "on"` in the R-Machine strategy config so reactive surfaces
  // get fresh-identity wrapping (otherwise reads from `useR()` render stale).
  reactCompiler: false,
};

export default nextConfig;

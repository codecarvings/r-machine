import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // TEMPORARY: the React Compiler memoizes subtrees on object identity, but an
  // OuterGear's consumer surface keeps a STABLE identity across state changes
  // (reactivity is delivered by re-render + live getter reads, not by a new
  // snapshot). The compiler therefore serves stale reads (e.g. a controlled
  // cart-quantity input). Disabled until R-Machine yields a fresh surface
  // identity per state change. See the surfaceA/surfaceB double-buffer in
  // packages/r-machine/src/core/juncture.ts.
  reactCompiler: false,
};

export default nextConfig;

/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Ambient `process` is not in the package's type surface (no @types/node —
// r-machine is kept runtime-agnostic). Declare the slice we read so we can
// reference `process.env.NODE_ENV` and let consumer bundlers (Vite, webpack,
// Next/Turbopack) statically replace it at build time, while the `typeof`
// guard keeps it safe on the browser where bundlers don't replace.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * `true` outside of a production build. Dev-only aids (deep-freeze of state,
 * tracing) gate on this; bundlers statically replace `process.env.NODE_ENV`,
 * so the guarded code is dead-code-eliminated from production builds.
 */
export function isDevEnv(excludeTest = false): boolean {
  if (excludeTest) {
    return typeof process !== "undefined" && process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";
  } else {
    return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
  }
}

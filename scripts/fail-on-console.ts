/*
  This script makes sure that any unexpected console output during tests
  causes the test to fail. This helps keep the test output clean and ensures
  that all important information is conveyed through test results rather than
  console logs.
  ---
  Adopted from: Zod - https://github.com/colinhacks/zod/blob/main/scripts/fail-on-console.ts
*/

import { afterAll, beforeAll } from "vitest";

const original = { ...console } as Record<string, any>;

function thrower(method: string) {
  return (...args: any[]) => {
    throw new Error(`Unexpected console.${method} call: ${args.join(" ")}`);
  };
}

beforeAll(() => {
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    // @ts-expect-error
    console[method] = thrower(method);
  }
});

afterAll(() => {
  Object.assign(console, original);
});

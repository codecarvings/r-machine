import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { SuspenseComponent } from "../../../src/utils/index.js";
import { DelayedSuspense } from "../../../src/utils/index.js";

describe("utils barrel exports", () => {
  it("should export DelayedSuspense as a function component", () => {
    expectTypeOf(DelayedSuspense).toBeFunction();
  });

  it("should export SuspenseComponent as a function type", () => {
    expectTypeOf<SuspenseComponent>().toBeFunction();
    expectTypeOf<SuspenseComponent>().returns.toEqualTypeOf<ReactNode>();
  });
});

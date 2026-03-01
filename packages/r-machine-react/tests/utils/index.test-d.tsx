import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { SuspenseComponent } from "../../src/utils/index.js";
import { DelayedSuspense } from "../../src/utils/index.js";

describe("utils barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(DelayedSuspense).toBeFunction();

    expectTypeOf<SuspenseComponent>().toBeFunction();
    expectTypeOf<SuspenseComponent>().returns.toEqualTypeOf<ReactNode>();
  });
});

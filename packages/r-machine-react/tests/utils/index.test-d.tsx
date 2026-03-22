import { describe, expectTypeOf, it } from "vitest";
import type { SuspenseComponent as OriginalSuspenseComponent } from "../../src/utils/delayed-suspense.js";
import { DelayedSuspense as OriginalDelayedSuspense } from "../../src/utils/delayed-suspense.js";
import type { SuspenseComponent } from "../../src/utils/index.js";
import { DelayedSuspense } from "../../src/utils/index.js";

describe("utils barrel exports", () => {
  it("re-exports DelayedSuspense identical to the original", () => {
    expectTypeOf(DelayedSuspense).toEqualTypeOf(OriginalDelayedSuspense);
  });

  it("re-exports SuspenseComponent identical to the original", () => {
    expectTypeOf<SuspenseComponent>().toEqualTypeOf<OriginalSuspenseComponent>();
  });
});

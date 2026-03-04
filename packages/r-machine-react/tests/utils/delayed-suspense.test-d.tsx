import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import { DelayedSuspense, type SuspenseComponent } from "../../src/utils/delayed-suspense.js";

describe("SuspenseComponent type", () => {
  it("accepts children and optional fallback", () => {
    expectTypeOf<SuspenseComponent>().toBeCallableWith({
      children: <div />,
    });

    expectTypeOf<SuspenseComponent>().toBeCallableWith({
      children: <div />,
      fallback: <div>Loading</div>,
    });
  });

  it("returns ReactNode", () => {
    expectTypeOf<SuspenseComponent>().returns.toExtend<ReactNode>();
  });
});

describe("DelayedSuspense types", () => {
  it("create() with no arguments returns a SuspenseComponent", () => {
    expectTypeOf(DelayedSuspense.create()).toExtend<SuspenseComponent>();
  });

  it("create(number) returns a SuspenseComponent", () => {
    expectTypeOf(DelayedSuspense.create(500)).toExtend<SuspenseComponent>();
  });

  it("delay prop accepts number or undefined", () => {
    expectTypeOf(DelayedSuspense).parameter(0).toHaveProperty("delay").toExtend<number | undefined>();
  });

  it("fallback prop accepts ReactNode or undefined", () => {
    expectTypeOf(DelayedSuspense).parameter(0).toHaveProperty("fallback").toExtend<ReactNode | undefined>();
  });

  it("children prop is required", () => {
    expectTypeOf(DelayedSuspense).parameter(0).toHaveProperty("children").toExtend<ReactNode>();
  });
});

import type { RMachine } from "r-machine";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { SuspenseComponent } from "#r-machine/react/utils";
import type { ReactImpl, ReactRMachine, ReactToolset } from "../../../src/core/react-toolset.js";
import { createReactToolset } from "../../../src/core/react-toolset.js";

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

// ---------------------------------------------------------------------------
// createReactToolset
// ---------------------------------------------------------------------------

describe("createReactToolset", () => {
  it("accepts an RMachine and ReactImpl and returns a Promise of ReactToolset", () => {
    expectTypeOf(createReactToolset<TestAtlas>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas>>();
    expectTypeOf(createReactToolset<TestAtlas>)
      .parameter(1)
      .toEqualTypeOf<ReactImpl>();
    expectTypeOf(createReactToolset<TestAtlas>).returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas>>>();
  });
});

// ---------------------------------------------------------------------------
// ReactToolset
// ---------------------------------------------------------------------------

describe("ReactToolset", () => {
  it("has readonly ReactRMachine property", () => {
    expectTypeOf<ReactToolset<TestAtlas>["ReactRMachine"]>().toEqualTypeOf<ReactRMachine>();
  });

  it("useLocale returns string", () => {
    expectTypeOf<ReactToolset<TestAtlas>["useLocale"]>().toEqualTypeOf<() => string>();
  });

  it("useSetLocale returns a function that takes a string and returns Promise<void>", () => {
    expectTypeOf<ReactToolset<TestAtlas>["useSetLocale"]>().toEqualTypeOf<() => (newLocale: string) => Promise<void>>();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = ReactToolset<TestAtlas>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = ReactToolset<TestAtlas>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = ReactToolset<TestAtlas>;
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useR is a function", () => {
    expectTypeOf<ReactToolset<TestAtlas>["useR"]>().toBeFunction();
  });

  it("useRKit is a function", () => {
    expectTypeOf<ReactToolset<TestAtlas>["useRKit"]>().toBeFunction();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = ReactToolset<TestAtlas>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = ReactToolset<TestAtlas>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("useRKit return type maps namespaces to their resource types", () => {
    type UseRKit = ReactToolset<TestAtlas>["useRKit"];
    expectTypeOf<UseRKit>().toExtend<(...namespaces: ["common"]) => readonly [TestAtlas["common"]]>();
    expectTypeOf<UseRKit>().toExtend<
      (...namespaces: ["common", "nav"]) => readonly [TestAtlas["common"], TestAtlas["nav"]]
    >();
  });

  it("has exactly the expected properties", () => {
    expectTypeOf<ReactToolset<TestAtlas>>().toHaveProperty("ReactRMachine");
    expectTypeOf<ReactToolset<TestAtlas>>().toHaveProperty("useLocale");
    expectTypeOf<ReactToolset<TestAtlas>>().toHaveProperty("useSetLocale");
    expectTypeOf<ReactToolset<TestAtlas>>().toHaveProperty("useR");
    expectTypeOf<ReactToolset<TestAtlas>>().toHaveProperty("useRKit");

    type Keys = keyof ReactToolset<TestAtlas>;
    expectTypeOf<Keys>().toEqualTypeOf<"ReactRMachine" | "useLocale" | "useSetLocale" | "useR" | "useRKit">();
  });
});

// ---------------------------------------------------------------------------
// ReactRMachine
// ---------------------------------------------------------------------------

describe("ReactRMachine", () => {
  it("is callable with children only (minimal props)", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({
      children: null as unknown as ReactNode,
    });
  });

  it("accepts fallback prop", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({
      fallback: null as unknown as ReactNode,
      children: null as unknown as ReactNode,
    });
  });

  it("accepts Suspense prop as SuspenseComponent", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({
      Suspense: null as unknown as SuspenseComponent,
      children: null as unknown as ReactNode,
    });
  });

  it("accepts Suspense prop as null", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({
      Suspense: null,
      children: null as unknown as ReactNode,
    });
  });

  it("accepts Suspense prop as undefined", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({
      Suspense: undefined,
      children: null as unknown as ReactNode,
    });
  });

  it("accepts all props together", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({
      fallback: null as unknown as ReactNode,
      Suspense: null as unknown as SuspenseComponent,
      children: null as unknown as ReactNode,
    });
  });

  it("returns ReactNode", () => {
    expectTypeOf<ReactRMachine>().returns.toExtend<ReactNode>();
  });

  it("does not have a probe property", () => {
    expectTypeOf<ReactRMachine>().not.toHaveProperty("probe");
  });
});

// ---------------------------------------------------------------------------
// ReactImpl
// ---------------------------------------------------------------------------

describe("ReactImpl", () => {
  it("readLocale returns string or Promise<string>", () => {
    expectTypeOf<ReactImpl["readLocale"]>().returns.toEqualTypeOf<string | Promise<string>>();
  });

  it("readLocale takes no parameters", () => {
    expectTypeOf<ReactImpl["readLocale"]>().parameters.toEqualTypeOf<[]>();
  });

  it("writeLocale takes a string parameter", () => {
    expectTypeOf<ReactImpl["writeLocale"]>().parameter(0).toEqualTypeOf<string>();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<ReactImpl["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });
});

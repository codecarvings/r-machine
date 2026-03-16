import type { RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { SuspenseComponent } from "#r-machine/react/utils";
import type { ReactImpl, ReactRMachine, ReactToolset } from "../../src/core/react-toolset.js";
import { createReactToolset } from "../../src/core/react-toolset.js";

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

// ---------------------------------------------------------------------------
// createReactToolset
// ---------------------------------------------------------------------------

describe("createReactToolset", () => {
  it("accepts an RMachine and ReactImpl and returns a Promise of ReactToolset", () => {
    expectTypeOf(createReactToolset<TestAtlas, AnyLocale>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, AnyLocale>>();
    expectTypeOf(createReactToolset<TestAtlas, AnyLocale>)
      .parameter(1)
      .toEqualTypeOf<ReactImpl<AnyLocale>>();
    expectTypeOf(createReactToolset<TestAtlas, AnyLocale>).returns.toEqualTypeOf<
      Promise<ReactToolset<TestAtlas, AnyLocale>>
    >();
  });
});

// ---------------------------------------------------------------------------
// ReactToolset
// ---------------------------------------------------------------------------

describe("ReactToolset", () => {
  it("has readonly ReactRMachine property", () => {
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>["ReactRMachine"]>().toEqualTypeOf<ReactRMachine>();
  });

  it("useLocale returns AnyLocale", () => {
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>["useLocale"]>().toEqualTypeOf<() => AnyLocale>();
  });

  it("useSetLocale returns a function that takes AnyLocale and returns Promise<void>", () => {
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: AnyLocale) => Promise<void>
    >();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = ReactToolset<TestAtlas, AnyLocale>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = ReactToolset<TestAtlas, AnyLocale>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = ReactToolset<TestAtlas, AnyLocale>;
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = ReactToolset<TestAtlas, AnyLocale>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = ReactToolset<TestAtlas, AnyLocale>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("useRKit return type maps namespaces to their resource types", () => {
    type UseRKit = ReactToolset<TestAtlas, AnyLocale>["useRKit"];
    expectTypeOf<UseRKit>().toExtend<(...namespaces: ["common"]) => readonly [TestAtlas["common"]]>();
    expectTypeOf<UseRKit>().toExtend<
      (...namespaces: ["common", "nav"]) => readonly [TestAtlas["common"], TestAtlas["nav"]]
    >();
  });

  it("has exactly the expected properties", () => {
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>>().toHaveProperty("ReactRMachine");
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>>().toHaveProperty("useLocale");
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>>().toHaveProperty("useSetLocale");
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>>().toHaveProperty("useR");
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>>().toHaveProperty("useRKit");

    type Keys = keyof ReactToolset<TestAtlas, AnyLocale>;
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
  it("readLocale returns AnyLocale or Promise<AnyLocale>", () => {
    expectTypeOf<ReactImpl<AnyLocale>["readLocale"]>().returns.toEqualTypeOf<string | Promise<string>>();
  });

  it("readLocale takes no parameters", () => {
    expectTypeOf<ReactImpl<AnyLocale>["readLocale"]>().parameters.toEqualTypeOf<[]>();
  });

  it("writeLocale takes an AnyLocale parameter", () => {
    expectTypeOf<ReactImpl<AnyLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<string>();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<ReactImpl<AnyLocale>["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("useLocale returns the narrowed locale type", () => {
    expectTypeOf<ReactToolset<TestAtlas, AppLocale>["useLocale"]>().toEqualTypeOf<() => AppLocale>();
  });

  it("useSetLocale accepts only the narrowed locale type", () => {
    expectTypeOf<ReactToolset<TestAtlas, AppLocale>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: AppLocale) => Promise<void>
    >();
  });

  it("narrowed toolset is not assignable to differently-narrowed toolset", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactToolset<TestAtlas, AppLocale>>().not.toEqualTypeOf<ReactToolset<TestAtlas, OtherLocale>>();
  });

  it("ReactImpl with narrowed locale constrains readLocale and writeLocale", () => {
    expectTypeOf<ReactImpl<AppLocale>["readLocale"]>().returns.toEqualTypeOf<AppLocale | Promise<AppLocale>>();
    expectTypeOf<ReactImpl<AppLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<AppLocale>();
  });
});

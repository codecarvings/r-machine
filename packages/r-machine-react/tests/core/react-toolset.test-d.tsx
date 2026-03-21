import type { AnyFmtProvider, RMachine } from "r-machine";
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
    expectTypeOf(createReactToolset<TestAtlas, AnyLocale, AnyFmtProvider>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, AnyLocale, AnyFmtProvider>>();
    expectTypeOf(createReactToolset<TestAtlas, AnyLocale, AnyFmtProvider>)
      .parameter(1)
      .toEqualTypeOf<ReactImpl<AnyLocale>>();
    expectTypeOf(createReactToolset<TestAtlas, AnyLocale, AnyFmtProvider>).returns.toEqualTypeOf<
      Promise<ReactToolset<TestAtlas, AnyLocale>>
    >();
  });
});

// ---------------------------------------------------------------------------
// ReactToolset
// ---------------------------------------------------------------------------

describe("ReactToolset", () => {
  it("has readonly ReactRMachine property (different from bare)", () => {
    expectTypeOf<ReactToolset<TestAtlas, AnyLocale>["ReactRMachine"]>().toEqualTypeOf<ReactRMachine>();
  });

  it("has the same hook properties as ReactBareToolset (via Omit & intersection)", () => {
    type Keys = keyof ReactToolset<TestAtlas, AnyLocale>;
    expectTypeOf<Keys>().toEqualTypeOf<"ReactRMachine" | "useLocale" | "useSetLocale" | "useR" | "useRKit">();
  });

  it("useRKit return type maps namespaces to their resource types", () => {
    type UseRKit = ReactToolset<TestAtlas, AnyLocale>["useRKit"];
    expectTypeOf<UseRKit>().toExtend<(...namespaces: ["common"]) => readonly [TestAtlas["common"]]>();
    expectTypeOf<UseRKit>().toExtend<
      (...namespaces: ["common", "nav"]) => readonly [TestAtlas["common"], TestAtlas["nav"]]
    >();
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

  it("ReactImpl with narrowed locale constrains readLocale and writeLocale", () => {
    expectTypeOf<ReactImpl<AppLocale>["readLocale"]>().returns.toEqualTypeOf<AppLocale | Promise<AppLocale>>();
    expectTypeOf<ReactImpl<AppLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<AppLocale>();
  });

  it("useSetLocale setter rejects locale values not in L", () => {
    const setLocale = {} as ReturnType<ReactToolset<TestAtlas, AppLocale>["useSetLocale"]>;
    // @ts-expect-error - "fr" is not in AppLocale ("en" | "it")
    setLocale("fr");
  });

  it("writeLocale rejects locale values not in L", () => {
    const impl = {} as ReactImpl<AppLocale>;
    // @ts-expect-error - "fr" is not in AppLocale ("en" | "it")
    impl.writeLocale("fr");
  });
});

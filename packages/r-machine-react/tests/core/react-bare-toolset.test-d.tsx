import type { AnyFmtProvider, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactBareRMachine, ReactBareToolset } from "../../src/core/react-bare-toolset.js";
import { createReactBareToolset } from "../../src/core/react-bare-toolset.js";

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

// ---------------------------------------------------------------------------
// createReactBareToolset
// ---------------------------------------------------------------------------

describe("createReactBareToolset", () => {
  it("accepts an RMachine and returns a Promise of ReactBareToolset", () => {
    expectTypeOf(createReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, AnyLocale, AnyFmtProvider>>();
    expectTypeOf(createReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>).returns.toEqualTypeOf<
      Promise<ReactBareToolset<TestAtlas, AnyLocale>>
    >();
  });
});

// ---------------------------------------------------------------------------
// ReactBareToolset
// ---------------------------------------------------------------------------

describe("ReactBareToolset", () => {
  it("has readonly ReactRMachine property", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>["ReactRMachine"]>().toEqualTypeOf<
      ReactBareRMachine<AnyLocale>
    >();
  });

  it("useLocale returns AnyLocale", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>["useLocale"]>().toEqualTypeOf<() => AnyLocale>();
  });

  it("useSetLocale returns a function that takes AnyLocale and returns Promise<void>", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: AnyLocale) => Promise<void>
    >();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = ReactBareToolset<TestAtlas, AnyLocale>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = ReactBareToolset<TestAtlas, AnyLocale>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = ReactBareToolset<TestAtlas, AnyLocale>;

    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = ReactBareToolset<TestAtlas, AnyLocale>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = ReactBareToolset<TestAtlas, AnyLocale>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("has exactly the expected properties", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>>().toHaveProperty("ReactRMachine");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>>().toHaveProperty("useLocale");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>>().toHaveProperty("useSetLocale");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>>().toHaveProperty("useR");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale>>().toHaveProperty("useRKit");

    type Keys = keyof ReactBareToolset<TestAtlas, AnyLocale>;
    expectTypeOf<Keys>().toEqualTypeOf<"ReactRMachine" | "useLocale" | "useSetLocale" | "useR" | "useRKit">();
  });
});

// ---------------------------------------------------------------------------
// ReactBareRMachine
// ---------------------------------------------------------------------------

describe("ReactBareRMachine", () => {
  it("is callable with locale, children, and optional writeLocale", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({
      locale: "en",
      children: null as unknown as ReactNode,
    });

    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({
      locale: "en",
      writeLocale: async () => {},
      children: null as unknown as ReactNode,
    });
  });

  it("accepts writeLocale returning void (sync)", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({
      locale: "en",
      writeLocale: () => {},
      children: null as unknown as ReactNode,
    });
  });

  it("accepts writeLocale returning Promise<void> (async)", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({
      locale: "en",
      writeLocale: async () => {},
      children: null as unknown as ReactNode,
    });
  });

  it("accepts explicitly undefined writeLocale", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({
      locale: "en",
      writeLocale: undefined,
      children: null as unknown as ReactNode,
    });
  });

  it("returns ReactNode", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().returns.toExtend<ReactNode>();
  });

  it("probe accepts string or undefined and returns L | undefined", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>["probe"]>().toBeCallableWith("en");
    expectTypeOf<ReactBareRMachine<AnyLocale>["probe"]>().toBeCallableWith(undefined);
    expectTypeOf<ReactBareRMachine<AnyLocale>["probe"]>().returns.toEqualTypeOf<string | undefined>();
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("useLocale returns the narrowed locale type", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale>["useLocale"]>().toEqualTypeOf<() => AppLocale>();
  });

  it("useSetLocale accepts only the narrowed locale type", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: AppLocale) => Promise<void>
    >();
  });

  it("ReactBareRMachine locale prop is typed as the narrowed locale", () => {
    expectTypeOf<ReactBareRMachine<AppLocale>>().toBeCallableWith({
      locale: "en" as AppLocale,
      children: null as unknown as ReactNode,
    });
  });

  it("ReactBareRMachine writeLocale accepts the narrowed locale type", () => {
    expectTypeOf<ReactBareRMachine<AppLocale>>().toBeCallableWith({
      locale: "en" as AppLocale,
      writeLocale: (_newLocale: AppLocale) => {},
      children: null as unknown as ReactNode,
    });
  });

  it("probe accepts narrowed locale or undefined", () => {
    expectTypeOf<ReactBareRMachine<AppLocale>["probe"]>().parameter(0).toEqualTypeOf<string | undefined>();
  });

  it("probe returns narrowed locale or undefined", () => {
    expectTypeOf<ReactBareRMachine<AppLocale>["probe"]>().returns.toEqualTypeOf<AppLocale | undefined>();
  });

  it("narrowed toolset is not assignable to differently-narrowed toolset", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale>>().not.toEqualTypeOf<
      ReactBareToolset<TestAtlas, OtherLocale>
    >();
  });
});

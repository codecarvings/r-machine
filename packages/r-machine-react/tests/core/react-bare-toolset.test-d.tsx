import type { AnyFmtProvider, ExtractFmt, RMachine } from "r-machine";
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
      Promise<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>
    >();
  });
});

// ---------------------------------------------------------------------------
// ReactBareToolset
// ---------------------------------------------------------------------------

describe("ReactBareToolset", () => {
  it("has readonly ReactRMachine property", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["ReactRMachine"]>().toEqualTypeOf<
      ReactBareRMachine<AnyLocale>
    >();
  });

  it("useLocale returns AnyLocale", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useLocale"]>().toEqualTypeOf<
      () => AnyLocale
    >();
  });

  it("useSetLocale returns a function that takes AnyLocale and returns Promise<void>", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: AnyLocale) => Promise<void>
    >();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>;

    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("has exactly the expected properties", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>().toHaveProperty("ReactRMachine");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>().toHaveProperty("useLocale");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>().toHaveProperty("useSetLocale");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>().toHaveProperty("useR");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>().toHaveProperty("useRKit");
    expectTypeOf<ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>>().toHaveProperty("useFmt");

    type Keys = keyof ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>;
    expectTypeOf<Keys>().toEqualTypeOf<
      "ReactRMachine" | "useLocale" | "useSetLocale" | "useR" | "useRKit" | "useFmt"
    >();
  });
});

// ---------------------------------------------------------------------------
// useFmt
// ---------------------------------------------------------------------------

describe("useFmt", () => {
  it("returns ExtractFmt<FP> for AnyFmtProvider", () => {
    type UseFmt = ReactBareToolset<TestAtlas, AnyLocale, AnyFmtProvider>["useFmt"];
    expectTypeOf<UseFmt>().toEqualTypeOf<() => ExtractFmt<AnyFmtProvider>>();
  });

  it("extracts the concrete formatter type from a custom FmtProvider", () => {
    type TestFmt = { readonly date: (d: Date) => string };
    type TestFmtProvider = { readonly get: (locale: AnyLocale) => TestFmt };

    type UseFmt = ReactBareToolset<TestAtlas, AnyLocale, TestFmtProvider>["useFmt"];
    expectTypeOf<ReturnType<UseFmt>>().toEqualTypeOf<TestFmt>();
  });

  it("different FmtProviders produce non-assignable return types", () => {
    type FmtA = { readonly date: (d: Date) => string };
    type FmtB = { readonly number: (n: number) => string };
    type ProviderA = { readonly get: (locale: AnyLocale) => FmtA };
    type ProviderB = { readonly get: (locale: AnyLocale) => FmtB };

    type UseFmtA = ReactBareToolset<TestAtlas, AnyLocale, ProviderA>["useFmt"];
    type UseFmtB = ReactBareToolset<TestAtlas, AnyLocale, ProviderB>["useFmt"];
    expectTypeOf<ReturnType<UseFmtA>>().not.toEqualTypeOf<ReturnType<UseFmtB>>();
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
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale, AnyFmtProvider>["useLocale"]>().toEqualTypeOf<
      () => AppLocale
    >();
  });

  it("useSetLocale accepts only the narrowed locale type", () => {
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale, AnyFmtProvider>["useSetLocale"]>().toEqualTypeOf<
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
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale, AnyFmtProvider>>().not.toEqualTypeOf<
      ReactBareToolset<TestAtlas, OtherLocale, AnyFmtProvider>
    >();
  });
});

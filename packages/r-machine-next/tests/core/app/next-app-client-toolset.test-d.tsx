import type { NamespaceMap, RMachine } from "r-machine";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer } from "#r-machine/next/core";
import type {
  NextAppClientImpl,
  NextAppClientRMachine,
  NextAppClientToolset,
} from "../../../src/core/app/next-app-client-toolset.js";
import { createNextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import type { TestLocale, TranslatedPathAtlas } from "../../_fixtures/constants.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// createNextAppClientToolset
// ---------------------------------------------------------------------------

describe("createNextAppClientToolset", () => {
  it("accepts an RMachine and NextAppClientImpl as parameters", () => {
    expectTypeOf(createNextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, TestLocale, NamespaceMap<TestAtlas>>>();
    expectTypeOf(createNextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>)
      .parameter(1)
      .toEqualTypeOf<NextAppClientImpl<TestLocale>>();
  });

  it("returns a Promise of NextAppClientToolset", () => {
    expectTypeOf(
      createNextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>
    ).returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientToolset
// ---------------------------------------------------------------------------

describe("NextAppClientToolset", () => {
  it("has exactly the expected properties", () => {
    type Keys = keyof NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>;
    expectTypeOf<Keys>().toEqualTypeOf<
      "NextClientRMachine" | "useLocale" | "useSetLocale" | "usePathComposer" | "useR" | "useRKit"
    >();
  });

  it("does not have ReactRMachine", () => {
    expectTypeOf<
      NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>
    >().not.toHaveProperty("ReactRMachine");
  });

  it("NextClientRMachine locale parameter tracks the toolset's L parameter", () => {
    type ToolsetEnIt = NextAppClientToolset<TestAtlas, "en" | "it", NamespaceMap<TestAtlas>, TranslatedPathAtlas>;
    type ToolsetFrDe = NextAppClientToolset<TestAtlas, "fr" | "de", NamespaceMap<TestAtlas>, TranslatedPathAtlas>;
    expectTypeOf<ToolsetEnIt["NextClientRMachine"]>().toEqualTypeOf<NextAppClientRMachine<"en" | "it">>();
    expectTypeOf<ToolsetEnIt["NextClientRMachine"]>().not.toEqualTypeOf<ToolsetFrDe["NextClientRMachine"]>();
  });

  it("useLocale return type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppClientToolset<TestAtlas, "en" | "it", NamespaceMap<TestAtlas>, TranslatedPathAtlas>;
    type ToolsetFrDe = NextAppClientToolset<TestAtlas, "fr" | "de", NamespaceMap<TestAtlas>, TranslatedPathAtlas>;
    expectTypeOf<ReturnType<ToolsetEnIt["useLocale"]>>().toEqualTypeOf<"en" | "it">();
    expectTypeOf<ReturnType<ToolsetFrDe["useLocale"]>>().toEqualTypeOf<"fr" | "de">();
    expectTypeOf<ToolsetEnIt["useLocale"]>().not.toEqualTypeOf<ToolsetFrDe["useLocale"]>();
  });

  it("useSetLocale setter parameter type is determined by the L parameter", () => {
    type Setter = ReturnType<
      NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useSetLocale"]
    >;
    expectTypeOf<Setter>().toEqualTypeOf<(newLocale: TestLocale) => Promise<void>>();
    // Changing L changes the setter signature
    type OtherSetter = ReturnType<
      NextAppClientToolset<TestAtlas, "fr" | "de", NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useSetLocale"]
    >;
    expectTypeOf<Setter>().not.toEqualTypeOf<OtherSetter>();
  });

  it("useSetLocale setter rejects locale values not in L", () => {
    const setLocale = {} as ReturnType<
      NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useSetLocale"]
    >;
    // @ts-expect-error - "fr" is not in TestLocale ("en" | "it")
    setLocale("fr");
  });

  it("usePathComposer returns BoundPathComposer<PAD>", () => {
    expectTypeOf<
      NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["usePathComposer"]
    >().toEqualTypeOf<() => BoundPathComposer<TranslatedPathAtlas>>();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>;
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("different RA produce different toolset types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<
      NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>
    >().not.toEqualTypeOf<
      NextAppClientToolset<OtherAtlas, TestLocale, NamespaceMap<OtherAtlas>, TranslatedPathAtlas>
    >();
  });

  it("different L produce different toolset types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<
      NextAppClientToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>
    >().not.toEqualTypeOf<NextAppClientToolset<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas>>();
  });

  it("different PAD produce different path selectors", () => {
    type OtherPathAtlas = { readonly segment: { readonly "/contact": {} } };
    type PathSelector = NextAppClientToolset<
      TestAtlas,
      TestLocale,
      NamespaceMap<TestAtlas>,
      TranslatedPathAtlas
    >["usePathComposer"] extends () => BoundPathComposer<infer PS>
      ? PS
      : never;
    type OtherPathSelector = NextAppClientToolset<
      TestAtlas,
      TestLocale,
      NamespaceMap<TestAtlas>,
      OtherPathAtlas
    >["usePathComposer"] extends () => BoundPathComposer<infer PS>
      ? PS
      : never;
    expectTypeOf<PathSelector>().not.toEqualTypeOf<OtherPathSelector>();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientRMachine
// ---------------------------------------------------------------------------

describe("NextAppClientRMachine", () => {
  it("is callable with locale and children", () => {
    expectTypeOf<NextAppClientRMachine<TestLocale>>().toBeCallableWith({
      locale: "en",
      children: null as unknown as ReactNode,
    });
  });

  it("rejects locale values not in L", () => {
    const Component = {} as NextAppClientRMachine<TestLocale>;
    // @ts-expect-error - "fr" is not in TestLocale ("en" | "it")
    Component({ locale: "fr", children: null as unknown as ReactNode });
  });

  it("returns ReactNode", () => {
    expectTypeOf<NextAppClientRMachine<TestLocale>>().returns.toExtend<ReactNode>();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientImpl
// ---------------------------------------------------------------------------

describe("NextAppClientImpl", () => {
  it("has exactly the expected properties", () => {
    type Keys = keyof NextAppClientImpl<TestLocale>;
    expectTypeOf<Keys>().toEqualTypeOf<"onLoad" | "writeLocale" | "createUsePathComposer">();
  });

  it("onLoad can be undefined", () => {
    expectTypeOf<undefined>().toExtend<NextAppClientImpl<TestLocale>["onLoad"]>();
  });

  it("onLoad can be a function returning void", () => {
    expectTypeOf<(locale: TestLocale) => void>().toExtend<NonNullable<NextAppClientImpl<TestLocale>["onLoad"]>>();
  });

  it("onLoad can be a function returning a cleanup function", () => {
    expectTypeOf<(locale: TestLocale) => () => void>().toExtend<NonNullable<NextAppClientImpl<TestLocale>["onLoad"]>>();
  });

  it("writeLocale accepts locale as first parameter", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<TestLocale>();
  });

  it("writeLocale accepts newLocale as second parameter", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().parameter(1).toEqualTypeOf<TestLocale>();
  });

  it("writeLocale accepts pathname as third parameter", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().parameter(2).toBeString();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });

  it("createUsePathComposer accepts a useLocale function and returns a hook", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["createUsePathComposer"]>()
      .parameter(0)
      .toEqualTypeOf<() => TestLocale>();
    expectTypeOf<NextAppClientImpl<TestLocale>["createUsePathComposer"]>().returns.toEqualTypeOf<
      () => BoundPathComposer<AnyPathAtlas>
    >();
  });
});

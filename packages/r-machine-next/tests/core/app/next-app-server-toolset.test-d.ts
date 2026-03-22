import type { AnyFmtProvider, EmptyFmtProvider, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer, RMachineProxy } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type {
  NextAppServerImpl,
  NextAppServerRMachine,
  NextAppServerToolset,
} from "../../../src/core/app/next-app-server-toolset.js";
import { createNextAppServerToolset } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestLocale, TranslatedPathAtlas } from "../../_fixtures/constants.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// createNextAppServerToolset
// ---------------------------------------------------------------------------

describe("createNextAppServerToolset", () => {
  it("accepts RMachine, NextAppServerImpl, and NextAppClientRMachine as parameters", () => {
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, TestLocale, AnyFmtProvider>>();
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">)
      .parameter(1)
      .toEqualTypeOf<NextAppServerImpl<TestLocale, "locale">>();
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">)
      .parameter(2)
      .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
  });

  it("returns a Promise of NextAppServerToolset", () => {
    expectTypeOf(
      createNextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    ).returns.toEqualTypeOf<
      Promise<NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerToolset
// ---------------------------------------------------------------------------

describe("NextAppServerToolset", () => {
  type Toolset = NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Toolset;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "rMachineProxy"
      | "NextServerRMachine"
      | "generateLocaleStaticParams"
      | "bindLocale"
      | "getLocale"
      | "setLocale"
      | "pickR"
      | "pickRKit"
      | "getFmt"
      | "getPathComposer"
    >();
  });

  it("rMachineProxy is RMachineProxy", () => {
    expectTypeOf<Toolset["rMachineProxy"]>().toEqualTypeOf<RMachineProxy>();
  });

  it("NextServerRMachine is NextAppServerRMachine", () => {
    expectTypeOf<Toolset["NextServerRMachine"]>().toEqualTypeOf<NextAppServerRMachine>();
  });

  it("generateLocaleStaticParams returns a Promise of locale param arrays", () => {
    expectTypeOf<Toolset["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ locale: string }[]>>();
  });

  it("generateLocaleStaticParams return type changes with the locale key", () => {
    type Toolset1 = NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">;
    type Toolset2 = NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "lang">;

    expectTypeOf<Toolset1["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ locale: string }[]>>();
    expectTypeOf<Toolset2["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ lang: string }[]>>();
  });

  it("getLocale return type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppServerToolset<TestAtlas, "en" | "it", AnyFmtProvider, TranslatedPathAtlas, "locale">;
    type ToolsetFrDe = NextAppServerToolset<TestAtlas, "fr" | "de", AnyFmtProvider, TranslatedPathAtlas, "locale">;
    expectTypeOf<ReturnType<ToolsetEnIt["getLocale"]>>().toEqualTypeOf<Promise<"en" | "it">>();
    expectTypeOf<ReturnType<ToolsetFrDe["getLocale"]>>().toEqualTypeOf<Promise<"fr" | "de">>();
    expectTypeOf<ToolsetEnIt["getLocale"]>().not.toEqualTypeOf<ToolsetFrDe["getLocale"]>();
  });

  it("setLocale parameter type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppServerToolset<TestAtlas, "en" | "it", AnyFmtProvider, TranslatedPathAtlas, "locale">;
    type ToolsetFrDe = NextAppServerToolset<TestAtlas, "fr" | "de", AnyFmtProvider, TranslatedPathAtlas, "locale">;
    expectTypeOf<ToolsetEnIt["setLocale"]>().toEqualTypeOf<(newLocale: "en" | "it") => Promise<void>>();
    expectTypeOf<ToolsetEnIt["setLocale"]>().not.toEqualTypeOf<ToolsetFrDe["setLocale"]>();
  });

  it("setLocale rejects locale values not in L", () => {
    const toolset = {} as NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">;
    // @ts-expect-error - "fr" is not in TestLocale ("en" | "it")
    toolset.setLocale("fr");
  });

  it("getPathComposer returns Promise<BoundPathComposer<PA>>", () => {
    expectTypeOf<Toolset["getPathComposer"]>().toEqualTypeOf<() => Promise<BoundPathComposer<TranslatedPathAtlas>>>();
  });

  // -----------------------------------------------------------------------
  // pickR
  // -----------------------------------------------------------------------

  it("pickR is parameterized by namespace", () => {
    type PickR = Toolset["pickR"];
    expectTypeOf<PickR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("pickR rejects namespace arguments not in atlas keys", () => {
    type PickR = Toolset["pickR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<PickR>[0]>();
  });

  it("pickR return type is Promise<RA[N]> for a given namespace", () => {
    expectTypeOf<Toolset["pickR"]>().toExtend<(namespace: "common") => Promise<TestAtlas["common"]>>();
    expectTypeOf<Toolset["pickR"]>().toExtend<(namespace: "nav") => Promise<TestAtlas["nav"]>>();
  });

  // -----------------------------------------------------------------------
  // pickRKit
  // -----------------------------------------------------------------------

  it("pickRKit accepts namespace arguments constrained to atlas keys", () => {
    type PickRKit = Toolset["pickRKit"];
    expectTypeOf<PickRKit>().toBeCallableWith("common");
    expectTypeOf<PickRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<PickRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<PickRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("pickRKit rejects namespace arguments not in atlas keys", () => {
    type PickRKit = Toolset["pickRKit"];
    expectTypeOf<PickRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<PickRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("pickRKit return type is Promise<RKit> for given namespaces", () => {
    const pickRKit = {} as Toolset["pickRKit"];

    expectTypeOf(pickRKit("common")).toEqualTypeOf<Promise<readonly [TestAtlas["common"]]>>();
    expectTypeOf(pickRKit("common", "nav")).toEqualTypeOf<Promise<readonly [TestAtlas["common"], TestAtlas["nav"]]>>();
  });

  // -----------------------------------------------------------------------
  // getFmt
  // -----------------------------------------------------------------------

  it("getFmt return type is Promise<any> when FP is AnyFmtProvider", () => {
    expectTypeOf<Awaited<ReturnType<Toolset["getFmt"]>>>().toBeAny();
  });

  it("getFmt return type narrows with a concrete FP", () => {
    type ToolsetEmpty = NextAppServerToolset<TestAtlas, TestLocale, EmptyFmtProvider, TranslatedPathAtlas, "locale">;
    expectTypeOf<ReturnType<ToolsetEmpty["getFmt"]>>().toEqualTypeOf<Promise<{}>>();
  });

  it("different FP produce different getFmt return types", () => {
    type GetFmtAny = NextAppServerToolset<
      TestAtlas,
      TestLocale,
      AnyFmtProvider,
      TranslatedPathAtlas,
      "locale"
    >["getFmt"];
    type GetFmtEmpty = NextAppServerToolset<
      TestAtlas,
      TestLocale,
      EmptyFmtProvider,
      TranslatedPathAtlas,
      "locale"
    >["getFmt"];
    expectTypeOf<GetFmtAny>().not.toEqualTypeOf<GetFmtEmpty>();
  });

  // -----------------------------------------------------------------------
  // bindLocale
  // -----------------------------------------------------------------------

  it("bindLocale accepts AnyLocale and returns TestLocale", () => {
    expectTypeOf<Toolset["bindLocale"]>().toBeCallableWith("en");
    expectTypeOf<Toolset["bindLocale"]>().toExtend<(locale: AnyLocale) => TestLocale>();
  });

  it("bindLocale accepts a Promise of params and returns a Promise of params", () => {
    type Params = { locale: string };
    expectTypeOf<Toolset["bindLocale"]>().toBeCallableWith(Promise.resolve({} as Params));
    expectTypeOf<Toolset["bindLocale"]>().toExtend<(params: Promise<Params>) => Promise<Params>>();
  });

  // -----------------------------------------------------------------------
  // type discrimination
  // -----------------------------------------------------------------------

  it("different RA produce different toolset types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppServerToolset<OtherAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    >();
  });

  it("different L produce different toolset types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppServerToolset<TestAtlas, OtherLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    >();
  });

  it("different PA produce different path composers", () => {
    type OtherPathAtlas = { readonly decl: { readonly "/contact": {} } };
    type PathAtlasFromToolset = Toolset["getPathComposer"] extends () => Promise<BoundPathComposer<infer PA>>
      ? PA
      : never;
    type OtherPathAtlasFromToolset = NextAppServerToolset<
      TestAtlas,
      TestLocale,
      AnyFmtProvider,
      OtherPathAtlas,
      "locale"
    >["getPathComposer"] extends () => Promise<BoundPathComposer<infer PA>>
      ? PA
      : never;
    expectTypeOf<PathAtlasFromToolset>().not.toEqualTypeOf<OtherPathAtlasFromToolset>();
  });

  it("different FP produce different toolset types", () => {
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, EmptyFmtProvider, TranslatedPathAtlas, "locale">
    >();
  });

  it("different LK produce different toolset types", () => {
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<NextAppServerToolset<TestAtlas, TestLocale, AnyFmtProvider, TranslatedPathAtlas, "lang">>();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerRMachine
// ---------------------------------------------------------------------------

describe("NextAppServerRMachine", () => {
  it("is callable with children prop", () => {
    expectTypeOf<NextAppServerRMachine>().toBeCallableWith({
      children: null as unknown as ReactNode,
    });
  });

  it("returns Promise<ReactNode>", () => {
    expectTypeOf<NextAppServerRMachine>().returns.toEqualTypeOf<Promise<ReactNode>>();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerImpl
// ---------------------------------------------------------------------------

describe("NextAppServerImpl", () => {
  it("has exactly the expected properties", () => {
    type Keys = keyof NextAppServerImpl<TestLocale, "locale">;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "localeKey"
      | "autoLocaleBinding"
      | "writeLocale"
      | "createLocaleStaticParamsGenerator"
      | "createProxy"
      | "createBoundPathComposerSupplier"
    >();
  });

  it("localeKey preserves the LK literal type", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["localeKey"]>().toEqualTypeOf<"locale">();
    expectTypeOf<NextAppServerImpl<TestLocale, "lang">["localeKey"]>().toEqualTypeOf<"lang">();
  });

  it("autoLocaleBinding is boolean", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["autoLocaleBinding"]>().toBeBoolean();
  });

  it("writeLocale first parameter accepts L | undefined (current locale may be unknown)", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["writeLocale"]>()
      .parameter(0)
      .toEqualTypeOf<TestLocale | undefined>();
    // undefined must be accepted
    expectTypeOf<undefined>().toExtend<Parameters<NextAppServerImpl<TestLocale, "locale">["writeLocale"]>[0]>();
  });

  it("writeLocale second parameter is strictly L (the new locale)", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["writeLocale"]>().parameter(1).toEqualTypeOf<TestLocale>();
    // undefined must NOT be accepted for the new locale
    expectTypeOf<undefined>().not.toExtend<Parameters<NextAppServerImpl<TestLocale, "locale">["writeLocale"]>[1]>();
  });

  it("writeLocale remaining parameters are cookies and headers", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["writeLocale"]>().parameter(2).toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["writeLocale"]>().parameter(3).toEqualTypeOf<HeadersFn>();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<
      NextAppServerImpl<TestLocale, "locale">["writeLocale"]
    >().returns.toEqualTypeOf<void | Promise<void>>();
  });

  it("writeLocale parameter types change with L", () => {
    type ImplEnIt = NextAppServerImpl<"en" | "it", "locale">;
    type ImplFrDe = NextAppServerImpl<"fr" | "de", "locale">;
    expectTypeOf<ImplEnIt["writeLocale"]>().not.toEqualTypeOf<ImplFrDe["writeLocale"]>();
  });

  it("createLocaleStaticParamsGenerator returns a generator or Promise of generator", () => {
    type Generator = () => Promise<{ [key: string]: string }[]>;
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["createLocaleStaticParamsGenerator"]>().returns.toExtend<
      Generator | Promise<Generator>
    >();
  });

  it("createProxy returns RMachineProxy or Promise<RMachineProxy>", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["createProxy"]>().returns.toEqualTypeOf<
      RMachineProxy | Promise<RMachineProxy>
    >();
  });

  it("createBoundPathComposerSupplier accepts a getLocale function", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["createBoundPathComposerSupplier"]>()
      .parameter(0)
      .toEqualTypeOf<() => Promise<TestLocale>>();
  });

  it("createBoundPathComposerSupplier returns a supplier or its Promise", () => {
    type Supplier = () => Promise<BoundPathComposer<AnyPathAtlas>>;
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["createBoundPathComposerSupplier"]>().returns.toEqualTypeOf<
      Supplier | Promise<Supplier>
    >();
  });
});

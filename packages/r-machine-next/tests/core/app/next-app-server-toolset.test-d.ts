import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, NamespaceMap, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  NextServerPlugDefiner,
  NextServerPlugKitMap,
  RMachineProxy,
} from "#r-machine/next/core";
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
  it("accepts RMachine, serverKit, NextAppServerImpl, and NextAppClientRMachine as parameters", () => {
    expectTypeOf(
      createNextAppServerToolset<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        ExperimentalFlags,
        NextServerPlugKitMap<TestAtlas>,
        TranslatedPathAtlas,
        "locale"
      >
    )
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, TestLocale, ResEquipment<TestAtlas>, ExperimentalFlags>>();
    expectTypeOf(
      createNextAppServerToolset<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        ExperimentalFlags,
        NextServerPlugKitMap<TestAtlas>,
        TranslatedPathAtlas,
        "locale"
      >
    )
      .parameter(1)
      .toEqualTypeOf<NextServerPlugKitMap<TestAtlas>>();
    expectTypeOf(
      createNextAppServerToolset<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        ExperimentalFlags,
        NextServerPlugKitMap<TestAtlas>,
        TranslatedPathAtlas,
        "locale"
      >
    )
      .parameter(2)
      .toEqualTypeOf<NextAppServerImpl<TestLocale, "locale">>();
    expectTypeOf(
      createNextAppServerToolset<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        ExperimentalFlags,
        NextServerPlugKitMap<TestAtlas>,
        TranslatedPathAtlas,
        "locale"
      >
    )
      .parameter(3)
      .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
  });

  it("returns a Promise of NextAppServerToolset", () => {
    expectTypeOf(
      createNextAppServerToolset<
        TestAtlas,
        TestLocale,
        ResEquipment<TestAtlas>,
        ExperimentalFlags,
        NextServerPlugKitMap<TestAtlas>,
        TranslatedPathAtlas,
        "locale"
      >
    ).returns.toEqualTypeOf<
      Promise<
        NextAppServerToolset<TestAtlas, TestLocale, NextServerPlugKitMap<TestAtlas>, TranslatedPathAtlas, "locale">
      >
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerToolset
// ---------------------------------------------------------------------------

describe("NextAppServerToolset", () => {
  type Toolset = NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Toolset;
    expectTypeOf<Keys>().toEqualTypeOf<
      "rMachineProxy" | "NextServerRMachine" | "generateLocaleStaticParams" | "bindLocale" | "setLocale" | "ServerPlug"
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
    type Toolset1 = NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">;
    type Toolset2 = NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "lang">;

    expectTypeOf<Toolset1["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ locale: string }[]>>();
    expectTypeOf<Toolset2["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ lang: string }[]>>();
  });

  it("setLocale parameter type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppServerToolset<
      TestAtlas,
      "en" | "it",
      NamespaceMap<TestAtlas>,
      TranslatedPathAtlas,
      "locale"
    >;
    type ToolsetFrDe = NextAppServerToolset<
      TestAtlas,
      "fr" | "de",
      NamespaceMap<TestAtlas>,
      TranslatedPathAtlas,
      "locale"
    >;
    expectTypeOf<ToolsetEnIt["setLocale"]>().toEqualTypeOf<(newLocale: "en" | "it") => Promise<void>>();
    expectTypeOf<ToolsetEnIt["setLocale"]>().not.toEqualTypeOf<ToolsetFrDe["setLocale"]>();
  });

  it("setLocale rejects locale values not in L", () => {
    const toolset = {} as NextAppServerToolset<
      TestAtlas,
      TestLocale,
      NamespaceMap<TestAtlas>,
      TranslatedPathAtlas,
      "locale"
    >;
    // @ts-expect-error - "fr" is not in TestLocale ("en" | "it")
    toolset.setLocale("fr");
  });

  it("ServerPlug is NextServerPlugDefiner parameterized by RA, L, SKM, PA, LK", () => {
    expectTypeOf<Toolset["ServerPlug"]>().toEqualTypeOf<
      NextServerPlugDefiner<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >();
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
    interface OtherAtlas extends AnyResAtlas {
      readonly other: { readonly value: number };
    }
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppServerToolset<OtherAtlas, TestLocale, NamespaceMap<OtherAtlas>, TranslatedPathAtlas, "locale">
    >();
  });

  it("different L produce different toolset types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppServerToolset<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >();
  });

  it("different LK produce different toolset types", () => {
    expectTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "lang">
    >();
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
      | "createPathComposer"
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

  it("createPathComposer accepts a locale and returns BoundPathComposer", () => {
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["createPathComposer"]>()
      .parameter(0)
      .toEqualTypeOf<TestLocale>();
    expectTypeOf<NextAppServerImpl<TestLocale, "locale">["createPathComposer"]>().returns.toEqualTypeOf<
      BoundPathComposer<AnyPathAtlas>
    >();
  });
});

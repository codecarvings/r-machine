import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, NamespaceMap, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { NextServerPlugDefiner, NextServerPlugKitMap } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type {
  NextAppNoProxyServerImpl,
  NextAppNoProxyServerToolset,
} from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import { createNextAppNoProxyServerToolset } from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import type { NextAppServerImpl, NextAppServerRMachine } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestLocale, TranslatedPathAtlas } from "../../_fixtures/constants.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// createNextAppNoProxyServerToolset
// ---------------------------------------------------------------------------

describe("createNextAppNoProxyServerToolset", () => {
  it("accepts RMachine, serverKit, NextAppNoProxyServerImpl, and NextAppClientRMachine as parameters", () => {
    expectTypeOf(
      createNextAppNoProxyServerToolset<
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
      createNextAppNoProxyServerToolset<
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
      createNextAppNoProxyServerToolset<
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
      .toEqualTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">>();
    expectTypeOf(
      createNextAppNoProxyServerToolset<
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

  it("returns a Promise of NextAppNoProxyServerToolset", () => {
    expectTypeOf(
      createNextAppNoProxyServerToolset<
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
        NextAppNoProxyServerToolset<
          TestAtlas,
          TestLocale,
          NextServerPlugKitMap<TestAtlas>,
          TranslatedPathAtlas,
          "locale"
        >
      >
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppNoProxyServerToolset
// ---------------------------------------------------------------------------

describe("NextAppNoProxyServerToolset", () => {
  type Toolset = NextAppNoProxyServerToolset<
    TestAtlas,
    TestLocale,
    NamespaceMap<TestAtlas>,
    TranslatedPathAtlas,
    "locale"
  >;

  it("has exactly the expected properties", () => {
    type Keys = keyof Toolset;
    expectTypeOf<Keys>().toEqualTypeOf<
      "NextServerRMachine" | "generateLocaleStaticParams" | "bindLocale" | "setLocale" | "ServerPlug" | "routeHandlers"
    >();
  });

  it("does not have rMachineProxy", () => {
    expectTypeOf<Toolset>().not.toHaveProperty("rMachineProxy");
  });

  it("NextServerRMachine is NextAppServerRMachine", () => {
    expectTypeOf<Toolset["NextServerRMachine"]>().toEqualTypeOf<NextAppServerRMachine>();
  });

  it("generateLocaleStaticParams returns a Promise of locale param arrays", () => {
    expectTypeOf<Toolset["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ locale: string }[]>>();
  });

  it("setLocale parameter type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppNoProxyServerToolset<
      TestAtlas,
      "en" | "it",
      NamespaceMap<TestAtlas>,
      TranslatedPathAtlas,
      "locale"
    >;
    type ToolsetFrDe = NextAppNoProxyServerToolset<
      TestAtlas,
      "fr" | "de",
      NamespaceMap<TestAtlas>,
      TranslatedPathAtlas,
      "locale"
    >;
    expectTypeOf<ToolsetEnIt["setLocale"]>().toEqualTypeOf<(newLocale: "en" | "it") => Promise<void>>();
    expectTypeOf<ToolsetEnIt["setLocale"]>().not.toEqualTypeOf<ToolsetFrDe["setLocale"]>();
  });

  it("ServerPlug is NextServerPlugDefiner parameterized by RA, L, SKM, PA, LK", () => {
    expectTypeOf<Toolset["ServerPlug"]>().toEqualTypeOf<
      NextServerPlugDefiner<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >();
  });

  // -----------------------------------------------------------------------
  // routeHandlers
  // -----------------------------------------------------------------------

  it("routeHandlers has entrance.GET", () => {
    expectTypeOf<Toolset["routeHandlers"]>().toHaveProperty("entrance");
    expectTypeOf<Toolset["routeHandlers"]["entrance"]>().toHaveProperty("GET");
    expectTypeOf<Toolset["routeHandlers"]["entrance"]["GET"]>().toEqualTypeOf<() => Promise<void>>();
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
      NextAppNoProxyServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<OtherAtlas, TestLocale, NamespaceMap<OtherAtlas>, TranslatedPathAtlas, "locale">
    >();
  });

  it("different L produce different toolset types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, OtherLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >();
  });

  it("different LK produce different toolset types", () => {
    expectTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "locale">
    >().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, TestLocale, NamespaceMap<TestAtlas>, TranslatedPathAtlas, "lang">
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppNoProxyServerImpl
// ---------------------------------------------------------------------------

describe("NextAppNoProxyServerImpl", () => {
  it("extends NextAppServerImpl", () => {
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">>().toExtend<NextAppServerImpl<TestLocale, "locale">>();
  });

  it("has exactly the expected properties", () => {
    type Keys = keyof NextAppNoProxyServerImpl<TestLocale, "locale">;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "localeKey"
      | "autoLocaleBinding"
      | "writeLocale"
      | "createLocaleStaticParamsGenerator"
      | "createProxy"
      | "createPathComposer"
      | "createRouteHandlers"
    >();
  });

  it("createRouteHandlers accepts cookies and headers", () => {
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>()
      .parameter(0)
      .toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>()
      .parameter(1)
      .toEqualTypeOf<HeadersFn>();
  });

  it("createRouteHandlers returns routeHandlers or Promise<routeHandlers>", () => {
    type Result = ReturnType<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>;
    type Expected = { readonly entrance: { readonly GET: () => Promise<void> } };
    expectTypeOf<Result>().toExtend<Expected | Promise<Expected>>();
  });

  it("createPathComposer accepts a locale and returns BoundPathComposer", () => {
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">["createPathComposer"]>()
      .parameter(0)
      .toEqualTypeOf<TestLocale>();
  });
});

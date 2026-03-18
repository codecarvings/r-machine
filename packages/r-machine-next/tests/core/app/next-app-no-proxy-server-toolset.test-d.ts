import type { RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { BoundPathComposer } from "#r-machine/next/core";
import type { AnyLocale } from "r-machine/locale";
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
  it("accepts RMachine, NextAppNoProxyServerImpl, and NextAppClientRMachine as parameters", () => {
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas, TestLocale>>();
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">)
      .parameter(1)
      .toEqualTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">>();
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">)
      .parameter(2)
      .toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
  });

  it("returns a Promise of NextAppNoProxyServerToolset", () => {
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">).returns.toEqualTypeOf<
      Promise<NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppNoProxyServerToolset
// ---------------------------------------------------------------------------

describe("NextAppNoProxyServerToolset", () => {
  type Toolset = NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    type Keys = keyof Toolset;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "NextServerRMachine"
      | "generateLocaleStaticParams"
      | "bindLocale"
      | "getLocale"
      | "setLocale"
      | "pickR"
      | "pickRKit"
      | "getPathComposer"
      | "routeHandlers"
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

  it("getLocale return type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppNoProxyServerToolset<TestAtlas, "en" | "it", TranslatedPathAtlas, "locale">;
    type ToolsetFrDe = NextAppNoProxyServerToolset<TestAtlas, "fr" | "de", TranslatedPathAtlas, "locale">;
    expectTypeOf<ReturnType<ToolsetEnIt["getLocale"]>>().toEqualTypeOf<Promise<"en" | "it">>();
    expectTypeOf<ReturnType<ToolsetFrDe["getLocale"]>>().toEqualTypeOf<Promise<"fr" | "de">>();
    expectTypeOf<ToolsetEnIt["getLocale"]>().not.toEqualTypeOf<ToolsetFrDe["getLocale"]>();
  });

  it("setLocale parameter type is determined by the L parameter", () => {
    type ToolsetEnIt = NextAppNoProxyServerToolset<TestAtlas, "en" | "it", TranslatedPathAtlas, "locale">;
    type ToolsetFrDe = NextAppNoProxyServerToolset<TestAtlas, "fr" | "de", TranslatedPathAtlas, "locale">;
    expectTypeOf<ToolsetEnIt["setLocale"]>().toEqualTypeOf<(newLocale: "en" | "it") => Promise<void>>();
    expectTypeOf<ToolsetEnIt["setLocale"]>().not.toEqualTypeOf<ToolsetFrDe["setLocale"]>();
  });

  it("getPathComposer returns Promise<BoundPathComposer<PA>>", () => {
    expectTypeOf<Toolset["getPathComposer"]>().toEqualTypeOf<() => Promise<BoundPathComposer<TranslatedPathAtlas>>>();
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
  // pickR
  // -----------------------------------------------------------------------

  it("pickR is parameterized by namespace", () => {
    type PickR = Toolset["pickR"];
    expectTypeOf<PickR>().parameter(0).toExtend<"common" | "nav">();
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
  });

  it("pickRKit return type is Promise<RKit> for given namespaces", () => {
    const pickRKit = {} as Toolset["pickRKit"];
    expectTypeOf(pickRKit("common")).toEqualTypeOf<Promise<readonly [TestAtlas["common"]]>>();
    expectTypeOf(pickRKit("common", "nav")).toEqualTypeOf<Promise<readonly [TestAtlas["common"], TestAtlas["nav"]]>>();
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
    expectTypeOf<NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<OtherAtlas, TestLocale, TranslatedPathAtlas, "locale">
    >();
  });

  it("different L produce different toolset types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, OtherLocale, TranslatedPathAtlas, "locale">
    >();
  });

  it("different LK produce different toolset types", () => {
    expectTypeOf<NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, TestLocale, TranslatedPathAtlas, "lang">
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
      | "createBoundPathComposerSupplier"
      | "createRouteHandlers"
    >();
  });

  it("createRouteHandlers accepts cookies, headers, and setLocale", () => {
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>().parameter(0).toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>().parameter(1).toEqualTypeOf<HeadersFn>();
    expectTypeOf<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>()
      .parameter(2)
      .toEqualTypeOf<(newLocale: TestLocale) => Promise<void>>();
  });

  it("createRouteHandlers returns routeHandlers or Promise<routeHandlers>", () => {
    type Result = ReturnType<NextAppNoProxyServerImpl<TestLocale, "locale">["createRouteHandlers"]>;
    type Expected = { readonly entrance: { readonly GET: () => Promise<void> } };
    expectTypeOf<Result>().toExtend<Expected | Promise<Expected>>();
  });
});

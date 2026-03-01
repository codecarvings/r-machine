import type { RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { BoundPathComposer } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type {
  NextAppNoProxyServerImpl,
  NextAppNoProxyServerToolset,
} from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import { createNextAppNoProxyServerToolset } from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import type { NextAppServerImpl, NextAppServerRMachine } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

type TestPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
  };
};

// ---------------------------------------------------------------------------
// createNextAppNoProxyServerToolset
// ---------------------------------------------------------------------------

describe("createNextAppNoProxyServerToolset", () => {
  it("accepts RMachine, NextAppNoProxyServerImpl, and NextAppClientRMachine as parameters", () => {
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas>>();
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">)
      .parameter(1)
      .toEqualTypeOf<NextAppNoProxyServerImpl>();
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">)
      .parameter(2)
      .toEqualTypeOf<NextAppClientRMachine>();
  });

  it("returns a Promise of NextAppNoProxyServerToolset", () => {
    expectTypeOf(createNextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">).returns.toEqualTypeOf<
      Promise<NextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppNoProxyServerToolset
// ---------------------------------------------------------------------------

describe("NextAppNoProxyServerToolset", () => {
  type Toolset = NextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    expectTypeOf<Toolset>().toHaveProperty("NextServerRMachine");
    expectTypeOf<Toolset>().toHaveProperty("generateLocaleStaticParams");
    expectTypeOf<Toolset>().toHaveProperty("bindLocale");
    expectTypeOf<Toolset>().toHaveProperty("getLocale");
    expectTypeOf<Toolset>().toHaveProperty("setLocale");
    expectTypeOf<Toolset>().toHaveProperty("pickR");
    expectTypeOf<Toolset>().toHaveProperty("pickRKit");
    expectTypeOf<Toolset>().toHaveProperty("getPathComposer");
    expectTypeOf<Toolset>().toHaveProperty("routeHandlers");

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

  it("getLocale returns Promise<string>", () => {
    expectTypeOf<Toolset["getLocale"]>().toEqualTypeOf<() => Promise<string>>();
  });

  it("setLocale accepts a string and returns Promise<void>", () => {
    expectTypeOf<Toolset["setLocale"]>().toEqualTypeOf<(newLocale: string) => Promise<void>>();
  });

  it("getPathComposer returns Promise<BoundPathComposer<PA>>", () => {
    expectTypeOf<Toolset["getPathComposer"]>().toEqualTypeOf<() => Promise<BoundPathComposer<TestPathAtlas>>>();
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

  it("bindLocale accepts a string and returns string", () => {
    expectTypeOf<Toolset["bindLocale"]>().toBeCallableWith("en");
    expectTypeOf<Toolset["bindLocale"]>().toExtend<(locale: string) => string>();
  });

  it("bindLocale accepts a Promise of params and returns a Promise of params", () => {
    type Params = { locale: string };
    expectTypeOf<Toolset["bindLocale"]>().toBeCallableWith(Promise.resolve({} as Params));
    expectTypeOf<Toolset["bindLocale"]>().toExtend<(params: Promise<Params>) => Promise<Params>>();
  });

  // -----------------------------------------------------------------------
  // type discrimination
  // -----------------------------------------------------------------------

  it("different atlas types produce different toolset types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<NextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<OtherAtlas, TestPathAtlas, "locale">
    >();
  });

  it("different locale key types produce different toolset types", () => {
    expectTypeOf<NextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerToolset<TestAtlas, TestPathAtlas, "lang">
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppNoProxyServerImpl
// ---------------------------------------------------------------------------

describe("NextAppNoProxyServerImpl", () => {
  it("extends NextAppServerImpl", () => {
    expectTypeOf<NextAppNoProxyServerImpl>().toExtend<NextAppServerImpl>();
  });

  it("has exactly the expected properties", () => {
    type Keys = keyof NextAppNoProxyServerImpl;
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
    expectTypeOf<NextAppNoProxyServerImpl["createRouteHandlers"]>().parameter(0).toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppNoProxyServerImpl["createRouteHandlers"]>().parameter(1).toEqualTypeOf<HeadersFn>();
    expectTypeOf<NextAppNoProxyServerImpl["createRouteHandlers"]>()
      .parameter(2)
      .toEqualTypeOf<(newLocale: string) => Promise<void>>();
  });

  it("createRouteHandlers returns routeHandlers or Promise<routeHandlers>", () => {
    type Result = ReturnType<NextAppNoProxyServerImpl["createRouteHandlers"]>;
    type Expected = { readonly entrance: { readonly GET: () => Promise<void> } };
    expectTypeOf<Result>().toExtend<Expected | Promise<Expected>>();
  });
});

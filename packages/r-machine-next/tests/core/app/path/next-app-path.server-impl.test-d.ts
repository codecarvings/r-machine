import type { AnyResourceAtlas, RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  HrefCanonicalizer,
  HrefTranslator,
  RMachineProxy,
} from "#r-machine/next/core";
import type { NextAppNoProxyServerImpl } from "#r-machine/next/core/app";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import { createNextAppPathServerImpl } from "../../../../src/core/app/path/next-app-path.server-impl.js";
import type { AnyNextAppPathStrategyConfig } from "../../../../src/core/app/path/next-app-path-strategy-core.js";

describe("createNextAppPathServerImpl", () => {
  it("requires RMachine<AnyResourceAtlas> as first parameter", () => {
    expectTypeOf(createNextAppPathServerImpl).parameter(0).toEqualTypeOf<RMachine<AnyResourceAtlas>>();
  });

  it("requires AnyNextAppPathStrategyConfig as second parameter", () => {
    expectTypeOf(createNextAppPathServerImpl).parameter(1).toEqualTypeOf<AnyNextAppPathStrategyConfig>();
  });

  it("requires HrefTranslator as third parameter (pathTranslator)", () => {
    expectTypeOf(createNextAppPathServerImpl).parameter(2).toEqualTypeOf<HrefTranslator>();
  });

  it("requires HrefCanonicalizer as fourth parameter (contentPathCanonicalizer)", () => {
    expectTypeOf(createNextAppPathServerImpl).parameter(3).toEqualTypeOf<HrefCanonicalizer>();
  });

  it("resolves to NextAppNoProxyServerImpl", () => {
    expectTypeOf(createNextAppPathServerImpl).returns.toEqualTypeOf<Promise<NextAppNoProxyServerImpl>>();
  });

  it("resolves to a concrete type, not any", () => {
    expectTypeOf<Awaited<ReturnType<typeof createNextAppPathServerImpl>>>().not.toBeAny();
  });

  it("rejects plain objects for the rMachine parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppPathServerImpl>[0]>();
  });

  it("rejects plain objects for the strategyConfig parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppPathServerImpl>[1]>();
  });

  it("prevents swapping HrefCanonicalizer into the HrefTranslator slot", () => {
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppPathServerImpl>[2]>();
  });

  it("prevents swapping HrefTranslator into the HrefCanonicalizer slot", () => {
    expectTypeOf<HrefTranslator>().not.toExtend<Parameters<typeof createNextAppPathServerImpl>[3]>();
  });

  it("pathTranslator and contentPathCanonicalizer are distinct types", () => {
    type P2 = Parameters<typeof createNextAppPathServerImpl>[2];
    type P3 = Parameters<typeof createNextAppPathServerImpl>[3];
    expectTypeOf<P2>().not.toEqualTypeOf<P3>();
  });
});

describe("NextAppNoProxyServerImpl property types", () => {
  it("localeKey is a string", () => {
    expectTypeOf<NextAppNoProxyServerImpl["localeKey"]>().toBeString();
  });

  it("autoLocaleBinding is a boolean", () => {
    expectTypeOf<NextAppNoProxyServerImpl["autoLocaleBinding"]>().toBeBoolean();
  });

  it("writeLocale accepts correct parameter types", () => {
    expectTypeOf<NextAppNoProxyServerImpl["writeLocale"]>().toBeFunction();
    expectTypeOf<NextAppNoProxyServerImpl["writeLocale"]>().parameter(0).toEqualTypeOf<string | undefined>();
    expectTypeOf<NextAppNoProxyServerImpl["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<NextAppNoProxyServerImpl["writeLocale"]>().parameter(2).toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppNoProxyServerImpl["writeLocale"]>().parameter(3).toEqualTypeOf<HeadersFn>();
    expectTypeOf<ReturnType<NextAppNoProxyServerImpl["writeLocale"]>>().toEqualTypeOf<void | Promise<void>>();
  });

  it("createLocaleStaticParamsGenerator returns a generator or promise of one", () => {
    type Fn = NextAppNoProxyServerImpl["createLocaleStaticParamsGenerator"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameters.toEqualTypeOf<[]>();
  });

  it("createProxy returns RMachineProxy or promise of one", () => {
    type Fn = NextAppNoProxyServerImpl["createProxy"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<RMachineProxy | Promise<RMachineProxy>>();
  });

  it("createBoundPathComposerSupplier accepts a getLocale function", () => {
    type Fn = NextAppNoProxyServerImpl["createBoundPathComposerSupplier"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameter(0).toEqualTypeOf<() => Promise<string>>();
  });

  it("createBoundPathComposerSupplier returns a supplier producing BoundPathComposer", () => {
    type Fn = NextAppNoProxyServerImpl["createBoundPathComposerSupplier"];
    type Supplier = () => Promise<BoundPathComposer<AnyPathAtlas>>;
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<Supplier | Promise<Supplier>>();
  });

  it("createRouteHandlers accepts cookies, headers, and setLocale", () => {
    type Fn = NextAppNoProxyServerImpl["createRouteHandlers"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameter(0).toEqualTypeOf<CookiesFn>();
    expectTypeOf<Fn>().parameter(1).toEqualTypeOf<HeadersFn>();
    expectTypeOf<Fn>().parameter(2).toEqualTypeOf<(newLocale: string) => Promise<void>>();
  });

  it("createRouteHandlers return type includes entrance.GET handler", () => {
    type Fn = NextAppNoProxyServerImpl["createRouteHandlers"];
    type Result = Awaited<ReturnType<Fn>>;
    expectTypeOf<Result>().toHaveProperty("entrance");
    expectTypeOf<Result["entrance"]>().toHaveProperty("GET");
    expectTypeOf<Result["entrance"]["GET"]>().toBeFunction();
    expectTypeOf<ReturnType<Result["entrance"]["GET"]>>().toEqualTypeOf<Promise<void>>();
  });
});

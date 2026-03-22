import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlasProvider,
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
  it("requires RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider> as first parameter", () => {
    expectTypeOf(createNextAppPathServerImpl)
      .parameter(0)
      .toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>>();
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
    expectTypeOf(createNextAppPathServerImpl).returns.toEqualTypeOf<
      Promise<NextAppNoProxyServerImpl<AnyLocale, any>>
    >();
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
  it("localeKey preserves the LK literal type", () => {
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, "locale">["localeKey"]>().toEqualTypeOf<"locale">();
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, "lang">["localeKey"]>().toEqualTypeOf<"lang">();
  });

  it("autoLocaleBinding is a boolean", () => {
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, string>["autoLocaleBinding"]>().toBeBoolean();
  });

  it("writeLocale first parameter accepts L | undefined", () => {
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>()
      .parameter(0)
      .toEqualTypeOf<string | undefined>();
    expectTypeOf<undefined>().toExtend<Parameters<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>[0]>();
  });

  it("writeLocale second parameter is strictly L", () => {
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<undefined>().not.toExtend<Parameters<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>[1]>();
  });

  it("writeLocale parameter types narrow when L is concrete", () => {
    type Narrow = NextAppNoProxyServerImpl<"en" | "it", string>;
    expectTypeOf<Narrow["writeLocale"]>().parameter(0).toEqualTypeOf<"en" | "it" | undefined>();
    expectTypeOf<Narrow["writeLocale"]>().parameter(1).toEqualTypeOf<"en" | "it">();
  });

  it("writeLocale remaining parameters are cookies and headers", () => {
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>().parameter(2).toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>().parameter(3).toEqualTypeOf<HeadersFn>();
    expectTypeOf<
      ReturnType<NextAppNoProxyServerImpl<AnyLocale, string>["writeLocale"]>
    >().toEqualTypeOf<void | Promise<void>>();
  });

  it("createLocaleStaticParamsGenerator returns a generator or promise of one", () => {
    type Fn = NextAppNoProxyServerImpl<AnyLocale, string>["createLocaleStaticParamsGenerator"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameters.toEqualTypeOf<[]>();
  });

  it("createProxy returns RMachineProxy or promise of one", () => {
    type Fn = NextAppNoProxyServerImpl<AnyLocale, string>["createProxy"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<RMachineProxy | Promise<RMachineProxy>>();
  });

  it("createBoundPathComposerSupplier locale getter parameter narrows with L", () => {
    type FnWide = NextAppNoProxyServerImpl<AnyLocale, string>["createBoundPathComposerSupplier"];
    expectTypeOf<FnWide>().parameter(0).toEqualTypeOf<() => Promise<string>>();

    type FnNarrow = NextAppNoProxyServerImpl<"en" | "it", string>["createBoundPathComposerSupplier"];
    expectTypeOf<FnNarrow>().parameter(0).toEqualTypeOf<() => Promise<"en" | "it">>();

    type Supplier = () => Promise<BoundPathComposer<AnyPathAtlasProvider>>;
    expectTypeOf<ReturnType<FnWide>>().toEqualTypeOf<Supplier | Promise<Supplier>>();
  });

  it("createRouteHandlers setLocale parameter narrows with L", () => {
    type FnWide = NextAppNoProxyServerImpl<AnyLocale, string>["createRouteHandlers"];
    expectTypeOf<FnWide>().parameter(0).toEqualTypeOf<CookiesFn>();
    expectTypeOf<FnWide>().parameter(1).toEqualTypeOf<HeadersFn>();
    expectTypeOf<FnWide>().parameter(2).toEqualTypeOf<(newLocale: string) => Promise<void>>();

    type FnNarrow = NextAppNoProxyServerImpl<"en" | "it", string>["createRouteHandlers"];
    expectTypeOf<FnNarrow>().parameter(2).toEqualTypeOf<(newLocale: "en" | "it") => Promise<void>>();
  });

  it("createRouteHandlers return type includes entrance.GET handler", () => {
    type Fn = NextAppNoProxyServerImpl<AnyLocale, string>["createRouteHandlers"];
    type Result = Awaited<ReturnType<Fn>>;
    expectTypeOf<Result>().toHaveProperty("entrance");
    expectTypeOf<Result["entrance"]>().toHaveProperty("GET");
    expectTypeOf<Result["entrance"]["GET"]>().toBeFunction();
    expectTypeOf<ReturnType<Result["entrance"]["GET"]>>().toEqualTypeOf<Promise<void>>();
  });

  it("different L produce different impl types", () => {
    expectTypeOf<NextAppNoProxyServerImpl<"en" | "it", "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerImpl<"fr" | "de", "locale">
    >();
  });

  it("different LK produce different impl types", () => {
    expectTypeOf<NextAppNoProxyServerImpl<AnyLocale, "locale">>().not.toEqualTypeOf<
      NextAppNoProxyServerImpl<AnyLocale, "lang">
    >();
  });
});

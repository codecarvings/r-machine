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
import type { NextAppServerImpl } from "#r-machine/next/core/app";
import { createNextAppFlatServerImpl } from "../../../../src/core/app/flat/next-app-flat.server-impl.js";
import type { AnyNextAppFlatStrategyConfig } from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";

describe("createNextAppFlatServerImpl", () => {
  it("requires RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider> as first parameter", () => {
    expectTypeOf(createNextAppFlatServerImpl)
      .parameter(0)
      .toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>>();
  });

  it("requires AnyNextAppFlatStrategyConfig as second parameter", () => {
    expectTypeOf(createNextAppFlatServerImpl).parameter(1).toEqualTypeOf<AnyNextAppFlatStrategyConfig>();
  });

  it("requires HrefTranslator as third parameter (pathTranslator)", () => {
    expectTypeOf(createNextAppFlatServerImpl).parameter(2).toEqualTypeOf<HrefTranslator>();
  });

  it("requires HrefCanonicalizer as fourth parameter (pathCanonicalizer)", () => {
    expectTypeOf(createNextAppFlatServerImpl).parameter(3).toEqualTypeOf<HrefCanonicalizer>();
  });

  it("resolves to NextAppServerImpl", () => {
    expectTypeOf(createNextAppFlatServerImpl).returns.toEqualTypeOf<Promise<NextAppServerImpl<AnyLocale, any>>>();
  });

  it("resolves to a concrete type, not any", () => {
    expectTypeOf<Awaited<ReturnType<typeof createNextAppFlatServerImpl>>>().not.toBeAny();
  });

  it("rejects plain objects for the rMachine parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppFlatServerImpl>[0]>();
  });

  it("rejects plain objects for the strategyConfig parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppFlatServerImpl>[1]>();
  });

  it("prevents swapping HrefCanonicalizer into the HrefTranslator slot", () => {
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppFlatServerImpl>[2]>();
  });

  it("prevents swapping HrefTranslator into the HrefCanonicalizer slot", () => {
    expectTypeOf<HrefTranslator>().not.toExtend<Parameters<typeof createNextAppFlatServerImpl>[3]>();
  });

  it("pathTranslator and pathCanonicalizer are distinct types", () => {
    type P2 = Parameters<typeof createNextAppFlatServerImpl>[2];
    type P3 = Parameters<typeof createNextAppFlatServerImpl>[3];
    expectTypeOf<P2>().not.toEqualTypeOf<P3>();
  });
});

describe("NextAppServerImpl property types", () => {
  it("writeLocale first parameter accepts L | undefined", () => {
    expectTypeOf<NextAppServerImpl<AnyLocale, string>["writeLocale"]>()
      .parameter(0)
      .toEqualTypeOf<string | undefined>();
    expectTypeOf<undefined>().toExtend<Parameters<NextAppServerImpl<AnyLocale, string>["writeLocale"]>[0]>();
  });

  it("writeLocale second parameter is strictly L", () => {
    expectTypeOf<NextAppServerImpl<AnyLocale, string>["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<undefined>().not.toExtend<Parameters<NextAppServerImpl<AnyLocale, string>["writeLocale"]>[1]>();
  });

  it("writeLocale returns void | Promise<void>", () => {
    expectTypeOf<
      ReturnType<NextAppServerImpl<AnyLocale, string>["writeLocale"]>
    >().toEqualTypeOf<void | Promise<void>>();
  });

  it("writeLocale parameter types narrow when L is concrete", () => {
    type Narrow = NextAppServerImpl<"en" | "it", string>;
    expectTypeOf<Narrow["writeLocale"]>().parameter(0).toEqualTypeOf<"en" | "it" | undefined>();
    expectTypeOf<Narrow["writeLocale"]>().parameter(1).toEqualTypeOf<"en" | "it">();
  });

  it("createProxy returns RMachineProxy or Promise<RMachineProxy>", () => {
    expectTypeOf<ReturnType<NextAppServerImpl<AnyLocale, string>["createProxy"]>>().toEqualTypeOf<
      RMachineProxy | Promise<RMachineProxy>
    >();
  });

  it("createBoundPathComposerSupplier locale getter parameter narrows with L", () => {
    type FnWide = NextAppServerImpl<AnyLocale, string>["createBoundPathComposerSupplier"];
    expectTypeOf<FnWide>().parameter(0).toEqualTypeOf<() => Promise<string>>();

    type FnNarrow = NextAppServerImpl<"en" | "it", string>["createBoundPathComposerSupplier"];
    expectTypeOf<FnNarrow>().parameter(0).toEqualTypeOf<() => Promise<"en" | "it">>();

    type Supplier = () => Promise<BoundPathComposer<AnyPathAtlasProvider>>;
    expectTypeOf<ReturnType<FnWide>>().toEqualTypeOf<Supplier | Promise<Supplier>>();
  });

  it("createLocaleStaticParamsGenerator returns a generator function", () => {
    type Fn = NextAppServerImpl<AnyLocale, string>["createLocaleStaticParamsGenerator"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<ReturnType<Fn>>().not.toBeAny();
  });

  it("localeKey preserves the LK literal type", () => {
    expectTypeOf<NextAppServerImpl<AnyLocale, "locale">["localeKey"]>().toEqualTypeOf<"locale">();
    expectTypeOf<NextAppServerImpl<AnyLocale, "lang">["localeKey"]>().toEqualTypeOf<"lang">();
  });

  it("autoLocaleBinding is boolean", () => {
    expectTypeOf<NextAppServerImpl<AnyLocale, string>["autoLocaleBinding"]>().toBeBoolean();
  });

  it("different L produce different impl types", () => {
    expectTypeOf<NextAppServerImpl<"en" | "it", "locale">>().not.toEqualTypeOf<
      NextAppServerImpl<"fr" | "de", "locale">
    >();
  });

  it("different LK produce different impl types", () => {
    expectTypeOf<NextAppServerImpl<AnyLocale, "locale">>().not.toEqualTypeOf<NextAppServerImpl<AnyLocale, "lang">>();
  });
});

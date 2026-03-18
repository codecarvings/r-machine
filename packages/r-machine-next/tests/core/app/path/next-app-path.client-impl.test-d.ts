// biome-ignore lint/style/useImportType: typeof requires a value import
import { useRouter } from "next/navigation";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer, HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import type { NextAppClientImpl } from "#r-machine/next/core/app";
import { createNextAppPathClientImpl } from "../../../../src/core/app/path/next-app-path.client-impl.js";
import type { AnyNextAppPathStrategyConfig } from "../../../../src/core/app/path/next-app-path-strategy-core.js";

describe("createNextAppPathClientImpl", () => {
  it("requires RMachine<AnyResourceAtlas, AnyLocale> as first parameter", () => {
    expectTypeOf(createNextAppPathClientImpl).parameter(0).toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale>>();
  });

  it("requires AnyNextAppPathStrategyConfig as second parameter", () => {
    expectTypeOf(createNextAppPathClientImpl).parameter(1).toEqualTypeOf<AnyNextAppPathStrategyConfig>();
  });

  it("requires HrefTranslator as third parameter (pathTranslator)", () => {
    expectTypeOf(createNextAppPathClientImpl).parameter(2).toEqualTypeOf<HrefTranslator>();
  });

  it("requires HrefCanonicalizer as fourth parameter (pathCanonicalizer)", () => {
    expectTypeOf(createNextAppPathClientImpl).parameter(3).toEqualTypeOf<HrefCanonicalizer>();
  });

  it("resolves to NextAppClientImpl", () => {
    expectTypeOf(createNextAppPathClientImpl).returns.toEqualTypeOf<Promise<NextAppClientImpl<AnyLocale>>>();
  });

  it("resolves to a concrete type, not any", () => {
    expectTypeOf<Awaited<ReturnType<typeof createNextAppPathClientImpl>>>().not.toBeAny();
  });

  it("rejects plain objects for the rMachine parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppPathClientImpl>[0]>();
  });

  it("rejects plain objects for the strategyConfig parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppPathClientImpl>[1]>();
  });

  it("prevents swapping HrefCanonicalizer into the HrefTranslator slot", () => {
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppPathClientImpl>[2]>();
  });

  it("prevents swapping HrefTranslator into the HrefCanonicalizer slot", () => {
    expectTypeOf<HrefTranslator>().not.toExtend<Parameters<typeof createNextAppPathClientImpl>[3]>();
  });

  it("pathTranslator and pathCanonicalizer are distinct types", () => {
    type P2 = Parameters<typeof createNextAppPathClientImpl>[2];
    type P3 = Parameters<typeof createNextAppPathClientImpl>[3];
    expectTypeOf<P2>().not.toEqualTypeOf<P3>();
  });
});

describe("NextAppClientImpl property types", () => {
  it("onLoad is an optional callback that may return a cleanup function", () => {
    type OnLoad = NextAppClientImpl<AnyLocale>["onLoad"];
    expectTypeOf<undefined>().toExtend<OnLoad>();
    expectTypeOf<OnLoad>().not.toBeAny();

    type OnLoadDefined = Exclude<OnLoad, undefined>;
    expectTypeOf<OnLoadDefined>().toBeFunction();
    expectTypeOf<OnLoadDefined>().parameter(0).toBeString();
    // biome-ignore lint/suspicious/noConfusingVoidType: verifying the actual source return type
    expectTypeOf<OnLoadDefined>().returns.toEqualTypeOf<void | (() => void)>();
  });

  it("writeLocale accepts correct parameter types and returns void | Promise<void>", () => {
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().toBeFunction();
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().parameter(0).toBeString();
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().parameter(2).toBeString();
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>()
      .parameter(3)
      .toEqualTypeOf<ReturnType<typeof useRouter>>();
    expectTypeOf<ReturnType<NextAppClientImpl<AnyLocale>["writeLocale"]>>().toEqualTypeOf<void | Promise<void>>();
  });

  it("createUsePathComposer accepts a useLocale hook and returns a hook producing BoundPathComposer", () => {
    type Fn = NextAppClientImpl<AnyLocale>["createUsePathComposer"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameter(0).toEqualTypeOf<() => string>();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<() => BoundPathComposer<AnyPathAtlas>>();
  });
});

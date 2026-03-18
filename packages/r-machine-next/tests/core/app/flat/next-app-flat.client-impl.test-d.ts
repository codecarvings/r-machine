import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer, HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import type { NextAppClientImpl } from "#r-machine/next/core/app";
import { createNextAppFlatClientImpl } from "../../../../src/core/app/flat/next-app-flat.client-impl.js";
import type { AnyNextAppFlatStrategyConfig } from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";

describe("createNextAppFlatClientImpl", () => {
  it("requires RMachine<AnyResourceAtlas, AnyLocale> as first parameter", () => {
    expectTypeOf(createNextAppFlatClientImpl).parameter(0).toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale>>();
  });

  it("requires AnyNextAppFlatStrategyConfig as second parameter", () => {
    expectTypeOf(createNextAppFlatClientImpl).parameter(1).toEqualTypeOf<AnyNextAppFlatStrategyConfig>();
  });

  it("requires HrefTranslator as third parameter (pathTranslator)", () => {
    expectTypeOf(createNextAppFlatClientImpl).parameter(2).toEqualTypeOf<HrefTranslator>();
  });

  it("requires HrefCanonicalizer as fourth parameter (pathCanonicalizer)", () => {
    expectTypeOf(createNextAppFlatClientImpl).parameter(3).toEqualTypeOf<HrefCanonicalizer>();
  });

  it("resolves to NextAppClientImpl", () => {
    expectTypeOf(createNextAppFlatClientImpl).returns.toEqualTypeOf<Promise<NextAppClientImpl<AnyLocale>>>();
  });

  it("resolves to a concrete type, not any", () => {
    expectTypeOf<Awaited<ReturnType<typeof createNextAppFlatClientImpl>>>().not.toBeAny();
  });

  it("rejects plain objects for the rMachine parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppFlatClientImpl>[0]>();
  });

  it("rejects plain objects for the strategyConfig parameter", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppFlatClientImpl>[1]>();
  });

  it("prevents swapping HrefCanonicalizer into the HrefTranslator slot", () => {
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppFlatClientImpl>[2]>();
  });

  it("prevents swapping HrefTranslator into the HrefCanonicalizer slot", () => {
    expectTypeOf<HrefTranslator>().not.toExtend<Parameters<typeof createNextAppFlatClientImpl>[3]>();
  });

  it("pathTranslator and pathCanonicalizer are distinct types", () => {
    type P2 = Parameters<typeof createNextAppFlatClientImpl>[2];
    type P3 = Parameters<typeof createNextAppFlatClientImpl>[3];
    expectTypeOf<P2>().not.toEqualTypeOf<P3>();
  });
});

describe("NextAppClientImpl property types", () => {
  it("onLoad is an optional callback that may return a cleanup function", () => {
    type OnLoad = NextAppClientImpl<AnyLocale>["onLoad"];
    expectTypeOf<undefined>().toExtend<OnLoad>();
    expectTypeOf<OnLoad>().not.toBeAny();
  });

  it("writeLocale accepts correct parameter types and returns void | Promise<void>", () => {
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().toBeFunction();
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().parameter(0).toBeString();
    expectTypeOf<NextAppClientImpl<AnyLocale>["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<ReturnType<NextAppClientImpl<AnyLocale>["writeLocale"]>>().toEqualTypeOf<void | Promise<void>>();
  });

  it("createUsePathComposer accepts a useLocale hook and returns a hook producing BoundPathComposer", () => {
    type Fn = NextAppClientImpl<AnyLocale>["createUsePathComposer"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameter(0).toEqualTypeOf<() => string>();
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<() => BoundPathComposer<AnyPathAtlas>>();
  });
});

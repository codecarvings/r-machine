import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import type { NextAppClientImpl } from "#r-machine/next/core/app";
import { createNextAppOriginClientImpl } from "../../../../src/core/app/origin/next-app-origin.client-impl.js";
import type { AnyNextAppOriginStrategyConfig } from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";

describe("createNextAppOriginClientImpl", () => {
  it("first parameter is RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>", () => {
    expectTypeOf(createNextAppOriginClientImpl)
      .parameter(0)
      .toEqualTypeOf<RMachine<AnyResourceAtlas, AnyLocale, AnyFmtProvider>>();
  });

  it("second parameter is AnyNextAppOriginStrategyConfig", () => {
    expectTypeOf(createNextAppOriginClientImpl).parameter(1).toEqualTypeOf<AnyNextAppOriginStrategyConfig>();
  });

  it("third parameter is HrefTranslator (pathTranslator)", () => {
    expectTypeOf(createNextAppOriginClientImpl).parameter(2).toEqualTypeOf<HrefTranslator>();
  });

  it("fourth parameter is HrefTranslator (urlTranslator)", () => {
    expectTypeOf(createNextAppOriginClientImpl).parameter(3).toEqualTypeOf<HrefTranslator>();
  });

  it("fifth parameter is HrefCanonicalizer", () => {
    expectTypeOf(createNextAppOriginClientImpl).parameter(4).toEqualTypeOf<HrefCanonicalizer>();
  });

  it("resolves to NextAppClientImpl", () => {
    expectTypeOf(createNextAppOriginClientImpl).returns.toEqualTypeOf<Promise<NextAppClientImpl<AnyLocale>>>();
  });

  it("does not accept a plain object as rMachine", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppOriginClientImpl>[0]>();
  });

  it("does not accept a plain object as strategyConfig", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppOriginClientImpl>[1]>();
  });

  it("HrefCanonicalizer is not assignable to HrefTranslator parameter slots", () => {
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppOriginClientImpl>[2]>();
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppOriginClientImpl>[3]>();
  });

  it("HrefTranslator is not assignable to HrefCanonicalizer parameter slot", () => {
    expectTypeOf<HrefTranslator>().not.toExtend<Parameters<typeof createNextAppOriginClientImpl>[4]>();
  });

  it("pathTranslator and urlTranslator share the same type (HrefTranslator)", () => {
    type P2 = Parameters<typeof createNextAppOriginClientImpl>[2];
    type P3 = Parameters<typeof createNextAppOriginClientImpl>[3];
    expectTypeOf<P2>().toEqualTypeOf<P3>();
  });

  it("pathCanonicalizer is a distinct type from pathTranslator", () => {
    type P2 = Parameters<typeof createNextAppOriginClientImpl>[2];
    type P4 = Parameters<typeof createNextAppOriginClientImpl>[4];
    expectTypeOf<P2>().not.toEqualTypeOf<P4>();
  });
});

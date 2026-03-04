import type { AnyResourceAtlas, RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import type { NextAppServerImpl } from "#r-machine/next/core/app";
import { createNextAppOriginServerImpl } from "../../../../src/core/app/origin/next-app-origin.server-impl.js";
import type { AnyNextAppOriginStrategyConfig } from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";

describe("createNextAppOriginServerImpl", () => {
  it("first parameter is RMachine<AnyResourceAtlas>", () => {
    expectTypeOf(createNextAppOriginServerImpl).parameter(0).toEqualTypeOf<RMachine<AnyResourceAtlas>>();
  });

  it("second parameter is AnyNextAppOriginStrategyConfig", () => {
    expectTypeOf(createNextAppOriginServerImpl).parameter(1).toEqualTypeOf<AnyNextAppOriginStrategyConfig>();
  });

  it("third parameter is HrefTranslator (pathTranslator)", () => {
    expectTypeOf(createNextAppOriginServerImpl).parameter(2).toEqualTypeOf<HrefTranslator>();
  });

  it("fourth parameter is HrefTranslator (urlTranslator)", () => {
    expectTypeOf(createNextAppOriginServerImpl).parameter(3).toEqualTypeOf<HrefTranslator>();
  });

  it("fifth parameter is HrefCanonicalizer", () => {
    expectTypeOf(createNextAppOriginServerImpl).parameter(4).toEqualTypeOf<HrefCanonicalizer>();
  });

  it("resolves to NextAppServerImpl", () => {
    expectTypeOf(createNextAppOriginServerImpl).returns.toEqualTypeOf<Promise<NextAppServerImpl>>();
  });

  it("does not accept a plain object as rMachine", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppOriginServerImpl>[0]>();
  });

  it("does not accept a plain object as strategyConfig", () => {
    expectTypeOf<{}>().not.toExtend<Parameters<typeof createNextAppOriginServerImpl>[1]>();
  });

  it("HrefCanonicalizer is not assignable to HrefTranslator parameter slots", () => {
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppOriginServerImpl>[2]>();
    expectTypeOf<HrefCanonicalizer>().not.toExtend<Parameters<typeof createNextAppOriginServerImpl>[3]>();
  });

  it("HrefTranslator is not assignable to HrefCanonicalizer parameter slot", () => {
    expectTypeOf<HrefTranslator>().not.toExtend<Parameters<typeof createNextAppOriginServerImpl>[4]>();
  });

  it("pathTranslator and urlTranslator share the same type (HrefTranslator)", () => {
    type P2 = Parameters<typeof createNextAppOriginServerImpl>[2];
    type P3 = Parameters<typeof createNextAppOriginServerImpl>[3];
    expectTypeOf<P2>().toEqualTypeOf<P3>();
  });

  it("pathCanonicalizer is a distinct type from pathTranslator", () => {
    type P2 = Parameters<typeof createNextAppOriginServerImpl>[2];
    type P4 = Parameters<typeof createNextAppOriginServerImpl>[4];
    expectTypeOf<P2>().not.toEqualTypeOf<P4>();
  });
});

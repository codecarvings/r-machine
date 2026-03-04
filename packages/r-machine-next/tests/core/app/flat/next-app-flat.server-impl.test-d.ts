import type { AnyResourceAtlas, RMachine } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  BoundPathComposer,
  HrefCanonicalizer,
  HrefTranslator,
  RMachineProxy,
} from "#r-machine/next/core";
import type { NextAppServerImpl } from "#r-machine/next/core/app";
import { createNextAppFlatServerImpl } from "../../../../src/core/app/flat/next-app-flat.server-impl.js";
import type { AnyNextAppFlatStrategyConfig } from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";

describe("createNextAppFlatServerImpl", () => {
  it("requires RMachine<AnyResourceAtlas> as first parameter", () => {
    expectTypeOf(createNextAppFlatServerImpl).parameter(0).toEqualTypeOf<RMachine<AnyResourceAtlas>>();
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
    expectTypeOf(createNextAppFlatServerImpl).returns.toEqualTypeOf<Promise<NextAppServerImpl>>();
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
  it("writeLocale accepts correct parameter types and returns void | Promise<void>", () => {
    expectTypeOf<NextAppServerImpl["writeLocale"]>().toBeFunction();
    expectTypeOf<NextAppServerImpl["writeLocale"]>().parameter(0).toEqualTypeOf<string | undefined>();
    expectTypeOf<NextAppServerImpl["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<ReturnType<NextAppServerImpl["writeLocale"]>>().toEqualTypeOf<void | Promise<void>>();
  });

  it("createProxy returns RMachineProxy or Promise<RMachineProxy>", () => {
    expectTypeOf<NextAppServerImpl["createProxy"]>().toBeFunction();
    expectTypeOf<ReturnType<NextAppServerImpl["createProxy"]>>().toEqualTypeOf<
      RMachineProxy | Promise<RMachineProxy>
    >();
  });

  it("createBoundPathComposerSupplier accepts a locale getter and returns a path composer supplier", () => {
    type Fn = NextAppServerImpl["createBoundPathComposerSupplier"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<Fn>().parameter(0).toEqualTypeOf<() => Promise<string>>();

    type Supplier = () => Promise<BoundPathComposer<AnyPathAtlas>>;
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<Supplier | Promise<Supplier>>();
  });

  it("createLocaleStaticParamsGenerator returns a generator function", () => {
    type Fn = NextAppServerImpl["createLocaleStaticParamsGenerator"];
    expectTypeOf<Fn>().toBeFunction();
    expectTypeOf<ReturnType<Fn>>().not.toBeAny();
  });

  it("localeKey is string", () => {
    expectTypeOf<NextAppServerImpl["localeKey"]>().toBeString();
  });

  it("autoLocaleBinding is boolean", () => {
    expectTypeOf<NextAppServerImpl["autoLocaleBinding"]>().toBeBoolean();
  });
});

import type { RMachine } from "r-machine";
import type { ExperimentalFlags, ResEquipment, SwitchableOption } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import {
  type AnyReactStandardStrategyConfig,
  type ReactStandardStrategyConfig,
  type ReactStandardStrategyConfigParams,
  ReactStandardStrategyCore,
} from "../../src/core/react-standard-strategy-core.js";
import type { ReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type { ReactImpl, ReactToolset } from "../../src/core/react-toolset.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type Cfg = ReactStandardStrategyConfig<TestAtlas, {}>;
type Params = ReactStandardStrategyConfigParams<TestAtlas, {}>;
type Core = ReactStandardStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg>;

// ---------------------------------------------------------------------------
// ReactStandardStrategyConfig (extends ReactStrategyConfig → also carries `kit`)
// ---------------------------------------------------------------------------

describe("ReactStandardStrategyConfig", () => {
  it("carries localeDetector / localeStore (plus the inherited kit)", () => {
    expectTypeOf<Cfg["localeDetector"]>().toEqualTypeOf<CustomLocaleDetector | undefined>();
    expectTypeOf<Cfg["localeStore"]>().toEqualTypeOf<CustomLocaleStore | undefined>();
    expectTypeOf<Cfg["reactCompiler"]>().toEqualTypeOf<SwitchableOption>();
    expectTypeOf<keyof Cfg>().toEqualTypeOf<"kit" | "reactCompiler" | "localeDetector" | "localeStore">();
  });

  it("requires its fields (an empty object / missing field is not assignable)", () => {
    expectTypeOf<{}>().not.toExtend<Cfg>();
    expectTypeOf<{ readonly kit: {}; readonly localeStore: undefined }>().not.toExtend<Cfg>();
  });

  it("accepts sync/async localeDetector and sync/async localeStore", () => {
    expectTypeOf<{
      kit: {};
      reactCompiler: "off";
      localeDetector: () => string;
      localeStore: undefined;
    }>().toExtend<Cfg>();
    expectTypeOf<{
      kit: {};
      reactCompiler: "off";
      localeDetector: () => Promise<string>;
      localeStore: undefined;
    }>().toExtend<Cfg>();
    expectTypeOf<{
      kit: {};
      reactCompiler: "off";
      localeDetector: undefined;
      localeStore: { get: () => string | undefined; set: (l: string) => void };
    }>().toExtend<Cfg>();
    expectTypeOf<{
      kit: {};
      reactCompiler: "off";
      localeDetector: undefined;
      localeStore: { get: () => Promise<string | undefined>; set: (l: string) => Promise<void> };
    }>().toExtend<Cfg>();
  });
});

describe("ReactStandardStrategyConfigParams", () => {
  it("makes every field optional (empty object allowed) and is a supertype of the full config", () => {
    expectTypeOf<{}>().toExtend<Params>();
    expectTypeOf<Cfg>().toExtend<Params>();
    expectTypeOf<Params>().not.toEqualTypeOf<Cfg>();
  });
});

// ---------------------------------------------------------------------------
// ReactStandardStrategyCore — class shape
// ---------------------------------------------------------------------------

describe("ReactStandardStrategyCore", () => {
  it("extends ReactStrategyCore and exposes rMachine / config", () => {
    expectTypeOf<Core>().toExtend<ReactStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg>>();
    expectTypeOf<Core["rMachine"]>().toEqualTypeOf<RMachine<TestAtlas, AnyLocale, E, EF>>();
    expectTypeOf<Core["config"]>().toEqualTypeOf<Cfg>();
  });

  it("static defaultConfig is an AnyReactStandardStrategyConfig", () => {
    expectTypeOf(ReactStandardStrategyCore.defaultConfig).toEqualTypeOf<AnyReactStandardStrategyConfig>();
  });

  it("createToolset() takes no params and returns Promise<ReactToolset<RA, L, EF, KM>>", () => {
    expectTypeOf<Core["createToolset"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<Core["createToolset"]>().returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas, AnyLocale, EF, {}>>>();
  });

  it("a subclass overriding createImpl still extends the base and can read rMachine/config", () => {
    class OverriddenStrategy extends ReactStandardStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg> {
      protected override createImpl(): Promise<ReactImpl<AnyLocale>> {
        const _machine: RMachine<TestAtlas, AnyLocale, E, EF> = this.rMachine;
        const _config: Cfg = this.config;
        return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
      }
    }
    expectTypeOf<OverriddenStrategy>().toExtend<Core>();
  });
});

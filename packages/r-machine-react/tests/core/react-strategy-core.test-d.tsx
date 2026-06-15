import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { Strategy } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import { type ReactStrategyConfig, ReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type { ReactImpl, ReactToolset } from "../../src/core/react-toolset.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

interface OtherAtlas extends AnyResAtlas {
  readonly settings: { readonly theme: string };
}

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type Cfg = ReactStrategyConfig<TestAtlas, {}>;
type OtherE = ResEquipment<OtherAtlas>;
type OtherCfg = ReactStrategyConfig<OtherAtlas, {}>;

// Concrete subclass for the protected createImpl hook.
class ConcreteStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg> {
  protected createImpl(): Promise<ReactImpl<AnyLocale>> {
    return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
  }
}

type Core<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  EE extends ResEquipment<RA>,
  C extends ReactStrategyConfig<RA, {}>,
> = ReactStrategyCore<RA, L, EE, EF, C>;

describe("ReactStrategyCore — class shape & inheritance", () => {
  it("extends Strategy<RA, L, E, EF, C>", () => {
    expectTypeOf<Core<TestAtlas, AnyLocale, E, Cfg>>().toExtend<Strategy<TestAtlas, AnyLocale, E, EF, Cfg>>();
    expectTypeOf<ConcreteStrategy>().toExtend<Strategy<TestAtlas, AnyLocale, E, EF, Cfg>>();
  });

  it("exposes rMachine: RMachine<RA, L, E, EF> and config: C", () => {
    expectTypeOf<Core<TestAtlas, AnyLocale, E, Cfg>["rMachine"]>().toEqualTypeOf<
      RMachine<TestAtlas, AnyLocale, E, EF>
    >();
    expectTypeOf<Core<TestAtlas, AnyLocale, E, Cfg>["config"]>().toEqualTypeOf<Cfg>();
  });
});

describe("ReactStrategyCore — createToolset", () => {
  it("takes no params and returns Promise<ReactToolset<RA, L, EF, KM>>", () => {
    expectTypeOf<Core<TestAtlas, AnyLocale, E, Cfg>["createToolset"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<Core<TestAtlas, AnyLocale, E, Cfg>["createToolset"]>().returns.toEqualTypeOf<
      Promise<ReactToolset<TestAtlas, AnyLocale, EF, {}>>
    >();
  });

  it("the returned toolset depends on RA, not on C", () => {
    type A = Awaited<ReturnType<Core<TestAtlas, AnyLocale, E, ReactStrategyConfig<TestAtlas, {}>>["createToolset"]>>;
    type B = Awaited<ReturnType<Core<TestAtlas, AnyLocale, E, ReactStrategyConfig<TestAtlas, {}>>["createToolset"]>>;
    expectTypeOf<A>().toEqualTypeOf<B>();
  });

  it("different atlases produce different toolset return types", () => {
    type A = Awaited<ReturnType<Core<TestAtlas, AnyLocale, E, Cfg>["createToolset"]>>;
    type B = Awaited<ReturnType<Core<OtherAtlas, AnyLocale, OtherE, OtherCfg>["createToolset"]>>;
    expectTypeOf<A>().not.toEqualTypeOf<B>();
  });
});

describe("ReactStrategyCore — createImpl override", () => {
  it("a subclass overriding createImpl to return Promise<ReactImpl<L>> still extends the base", () => {
    class CustomStrategy extends ReactStrategyCore<TestAtlas, AnyLocale, E, EF, Cfg> {
      protected createImpl(): Promise<ReactImpl<AnyLocale>> {
        const _machine: RMachine<TestAtlas, AnyLocale, E, EF> = this.rMachine;
        const _config: Cfg = this.config;
        return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
      }
    }
    expectTypeOf<CustomStrategy>().toExtend<Core<TestAtlas, AnyLocale, E, Cfg>>();
  });
});

describe("ReactStrategyCore — generic distinctness", () => {
  it("different atlas / config produce non-equal strategy types", () => {
    expectTypeOf<Core<TestAtlas, AnyLocale, E, Cfg>>().not.toEqualTypeOf<
      Core<OtherAtlas, AnyLocale, OtherE, OtherCfg>
    >();
  });
});

describe("ReactStrategyCore — narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("a narrowed locale flows into rMachine and the toolset", () => {
    expectTypeOf<Core<TestAtlas, AppLocale, E, Cfg>["rMachine"]>().toEqualTypeOf<
      RMachine<TestAtlas, AppLocale, E, EF>
    >();
    type Result = Awaited<ReturnType<Core<TestAtlas, AppLocale, E, Cfg>["createToolset"]>>;
    expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AppLocale, EF, {}>>();
  });

  it("differently-narrowed strategies are not equal", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<Core<TestAtlas, AppLocale, E, Cfg>>().not.toEqualTypeOf<Core<TestAtlas, OtherLocale, E, Cfg>>();
  });
});

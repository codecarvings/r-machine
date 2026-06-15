import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyReactStandardStrategyConfig,
  ReactStandardStrategyConfig,
  ReactStandardStrategyConfigParams,
  ReactStandardStrategyCore,
  ReactToolset,
} from "#r-machine/react/core";
import { ReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";

// `create` rejects atlases carrying gear:inner entries; an atlas with an empty
// `let@gear:inner` makes the inner-gear guard collapse to no extra arg.
interface NoInnerAtlas extends AnyResAtlas {
  readonly common: { readonly greeting: string };
  readonly "let@gear:inner": {};
}

type E = ResEquipment<NoInnerAtlas>;
type EF = ExperimentalFlags;
type Cfg = ReactStandardStrategyConfig<NoInnerAtlas, {}>;
type Strat = ReactStandardStrategy<NoInnerAtlas, AnyLocale, E, EF, {}>;

describe("ReactStandardStrategy — class shape & inheritance", () => {
  it("extends ReactStandardStrategyCore with the FULL config (not the Params variant)", () => {
    expectTypeOf<Strat>().toExtend<ReactStandardStrategyCore<NoInnerAtlas, AnyLocale, E, EF, Cfg>>();
    expectTypeOf<Strat["config"]>().toEqualTypeOf<Cfg>();
    expectTypeOf<Strat["config"]>().not.toEqualTypeOf<ReactStandardStrategyConfigParams<NoInnerAtlas, {}>>();
  });

  it("exposes rMachine: RMachine<RA, L, E, EF>", () => {
    expectTypeOf<Strat["rMachine"]>().toEqualTypeOf<RMachine<NoInnerAtlas, AnyLocale, E, EF>>();
  });
});

describe("ReactStandardStrategy.create — public factory", () => {
  type CreateFn = typeof ReactStandardStrategy.create<NoInnerAtlas, AnyLocale, E, EF, {}>;

  it("takes (RMachine, Params) and returns a ReactStandardStrategy", () => {
    expectTypeOf<CreateFn>().parameter(0).toEqualTypeOf<RMachine<NoInnerAtlas, AnyLocale, E, EF>>();
    expectTypeOf<CreateFn>().parameter(1).toEqualTypeOf<ReactStandardStrategyConfigParams<NoInnerAtlas, {}>>();
    expectTypeOf<ReturnType<CreateFn>>().toEqualTypeOf<Strat>();
  });
});

describe("ReactStandardStrategy — createToolset & defaultConfig", () => {
  it("createToolset() takes no params and returns Promise<ReactToolset<RA, L, EF, KM>>", () => {
    expectTypeOf<Strat["createToolset"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<Strat["createToolset"]>().returns.toEqualTypeOf<
      Promise<ReactToolset<NoInnerAtlas, AnyLocale, EF, {}>>
    >();
  });

  it("inherits a static defaultConfig typed as AnyReactStandardStrategyConfig", () => {
    expectTypeOf(ReactStandardStrategy.defaultConfig).toEqualTypeOf<AnyReactStandardStrategyConfig>();
  });
});

import type { AnyAtlas, RMachine } from "r-machine";
import {
  type AnyNextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "#r-machine/next/core/app";

export class NextAppFlatStrategy<
  A extends AnyAtlas,
  C extends AnyNextAppFlatStrategyConfig,
> extends NextAppFlatStrategyCore<A, C> {
  constructor(rMachine: RMachine<A>);
  constructor(rMachine: RMachine<A>, config: PartialNextAppFlatStrategyConfig<C["pathAtlas"], C["localeKey"]>);
  constructor(rMachine: RMachine<A>, config: PartialNextAppFlatStrategyConfig<C["pathAtlas"], C["localeKey"]> = {}) {
    super(
      rMachine,
      {
        ...NextAppFlatStrategyCore.defaultConfig,
        ...config,
      } as C,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-flat.client-impl.js");
        return module.createNextAppFlatClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-flat.server-impl.js");
        return module.createNextAppFlatServerImpl(rMachine, strategyConfig);
      }
    );
  }
}

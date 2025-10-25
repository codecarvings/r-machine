import type { AnyAtlas, RMachine } from "r-machine";
import { createReactToolset, ReactStrategy, type ReactToolset as ReactTools } from "#r-machine/react/core";

interface ReactToolsetBuilder {
  readonly create: <A extends AnyAtlas>(rMachine: RMachine<A>, strategy: ReactStrategy<any>) => ReactTools<A>;
}

export const ReactToolset: ReactToolsetBuilder = {
  create: (rMachine, strategy) => {
    const strategyConfig = ReactStrategy.getConfig(strategy);
    const implPackage = ReactStrategy.getImplPackage(strategy);
    return createReactToolset(rMachine, strategyConfig, implPackage);
  },
};

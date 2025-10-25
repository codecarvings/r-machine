import type { AnyAtlas, RMachine } from "r-machine";
import { ReactStrategy } from "./react-strategy.js";
import type { ReactTools as ReactToolsInterface } from "./react-tools.js";
import { createReactTools } from "./react-tools.js";

interface ReactToolsBuilder {
  readonly create: <A extends AnyAtlas>(rMachine: RMachine<A>, strategy: ReactStrategy<any>) => ReactToolsInterface<A>;
}

export const ReactTools: ReactToolsBuilder = {
  create: (rMachine, strategy) => {
    const strategyConfig = ReactStrategy.getConfig(strategy);
    const implPackage = ReactStrategy.getImplPackage(strategy);
    return createReactTools(rMachine, strategyConfig, implPackage);
  },
};

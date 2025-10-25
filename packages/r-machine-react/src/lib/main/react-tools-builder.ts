import type { AnyAtlas, RMachine } from "r-machine";
import { ReactStrategy } from "../core/react-strategy.js";
import type { ReactTools as ReactToolsInterface } from "../core/react-tools.js";
import { createReactTools } from "../core/react-tools.js";

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

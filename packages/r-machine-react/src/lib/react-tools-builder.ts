import type { AnyAtlas, RMachine } from "r-machine";
import type { ReactStrategy } from "./react-strategy.js";
import type { ReactTools as RT } from "./react-tools.js";
import { createReactTools } from "./react-tools.js";

interface ReactToolsBuilder {
  readonly create: <A extends AnyAtlas>(rMachine: RMachine<A>, strategy: ReactStrategy<any, any>) => RT<A>;
}

export const ReactTools: ReactToolsBuilder = {
  create: (rMachine, strategy) =>
    createReactTools(rMachine, strategy, {
      writeLocale: () => ({}),
    }),
};

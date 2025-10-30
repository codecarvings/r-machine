import type { AnyAtlas, RMachine } from "r-machine";
import {
  createReactToolset,
  type ReactStandardImplProvider,
  type ReactStandardToolset,
  ReactStrategy,
  type ReactToolset as ReactTools,
} from "#r-machine/react/core";

interface ReactToolsetBuilder {
  create<A extends AnyAtlas>(rMachine: RMachine<A>): ReactTools<A>;
  create<A extends AnyAtlas>(rMachine: RMachine<A>, strategy: ReactStandardImplProvider<any>): ReactStandardToolset<A>;
}

export const ReactToolset: ReactToolsetBuilder = {
  create: (rMachine, strategy?: ReactStrategy<any>) => {
    if (strategy !== undefined) {
      return ReactStrategy.createToolset(rMachine, strategy);
    }

    return createReactToolset(rMachine);
  },
};

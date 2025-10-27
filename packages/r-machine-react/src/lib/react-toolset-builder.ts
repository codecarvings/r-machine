import type { AnyAtlas, RMachine } from "r-machine";
import { createReactToolset, type ReactToolset as ReactTools } from "#r-machine/react/core";

interface ReactToolsetBuilder {
  readonly create: <A extends AnyAtlas>(rMachine: RMachine<A>) => ReactTools<A>;
}

export const ReactToolset: ReactToolsetBuilder = {
  create: (rMachine) => {
    return createReactToolset(rMachine);
  },
};

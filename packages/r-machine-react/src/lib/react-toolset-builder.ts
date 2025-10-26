import type { AnyAtlas, RMachine } from "r-machine";
import { defaultBinProvider } from "r-machine/strategy";
import { createReactToolset, type ReactToolset as ReactTools } from "#r-machine/react/core";

interface ReactToolsetBuilder {
  readonly create: <A extends AnyAtlas>(rMachine: RMachine<A>) => ReactTools<A, null>;
}

export const ReactToolset: ReactToolsetBuilder = {
  create: (rMachine) => {
    return createReactToolset(rMachine, null, {
      writeLocale: defaultBinProvider,
    });
  },
};

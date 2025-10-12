import type { AnyAtlas, RMachine } from "r-machine";
import { ReactStrategy } from "../react-strategy.js";
import type { ReactStrategyImpl } from "../react-strategy-impl.js";

export class ReactPathStrategy extends ReactStrategy {
  protected getReactStrategyImpl<A extends AnyAtlas>(rMachine: RMachine<A>): ReactStrategyImpl {
    void rMachine;
    return {
      readLocale: ({ localeOption }) => {
        return localeOption;
      },
      writeLocale: () => {
        throw new Error("ReactPathStrategy does not support writing locale");
      },
    };
  }
}

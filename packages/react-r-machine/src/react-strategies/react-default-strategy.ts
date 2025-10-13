import type { AnyAtlas, RMachine } from "r-machine";
import { ReactStrategy } from "../react-strategy.js";
import type { ReactStrategyImpl } from "../react-strategy-impl.js";

type ReactStrategyPartialImpl = Partial<ReactDefaultStrategy>;
type ReactStrategyPartialImplFactory = (rMachine: RMachine<AnyAtlas>) => ReactStrategyPartialImpl;

const defaultImpl: ReactStrategyImpl = {
  readLocale: ({ localeOption }) => {
    return localeOption;
  },
  writeLocale: () => {
    throw new Error(
      "ReactDefaultStrategy by default does not support writing locale and no custom implementation was provided."
    );
  },
};

export class ReactDefaultStrategy extends ReactStrategy {
  constructor(
    protected readonly implOrImplFactory?: ReactStrategyPartialImpl | ReactStrategyPartialImplFactory | undefined
  ) {
    super();
  }

  protected getReactStrategyImpl(rMachine: RMachine<AnyAtlas>): ReactStrategyImpl {
    if (typeof this.implOrImplFactory === "function") {
      const impl = this.implOrImplFactory(rMachine);
      return {
        ...defaultImpl,
        ...impl,
      };
    } else {
      const impl = this.implOrImplFactory ?? {};
      return {
        ...defaultImpl,
        ...impl,
      };
    }
  }
}

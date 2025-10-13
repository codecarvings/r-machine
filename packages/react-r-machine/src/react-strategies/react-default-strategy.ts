import type { AnyAtlas, RMachine } from "r-machine";
import { ReactStrategy } from "../react-strategy.js";
import type { ReactStrategyImpl } from "../react-strategy-impl.js";

type ReactPartialStrategyImpl = Partial<ReactDefaultStrategy>;
type ReactPartialStrategyImplFactory = (rMachine: RMachine<AnyAtlas>) => ReactPartialStrategyImpl;

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
  constructor();
  constructor(config: ReactPartialStrategyImpl);
  constructor(config: ReactPartialStrategyImplFactory);
  constructor(protected readonly config?: ReactPartialStrategyImpl | ReactPartialStrategyImplFactory | undefined) {
    super();
  }

  protected getReactStrategyImpl(rMachine: RMachine<AnyAtlas>): ReactStrategyImpl {
    if (typeof this.config === "function") {
      const impl = this.config(rMachine);
      return {
        ...defaultImpl,
        ...impl,
      };
    } else {
      const impl = this.config ?? {};
      return {
        ...defaultImpl,
        ...impl,
      };
    }
  }
}

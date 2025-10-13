import type { ReactStrategyImpl, ReactStrategyImplFactory } from "../react-strategy-impl.js";
import { ReactDefaultStrategy } from "./react-default-strategy.js";

export class ReactCustomStrategy extends ReactDefaultStrategy {
  constructor(config: ReactStrategyImpl);
  constructor(config: ReactStrategyImplFactory);
  constructor(config: ReactStrategyImpl | ReactStrategyImplFactory) {
    super(config);
    void config;
  }
}

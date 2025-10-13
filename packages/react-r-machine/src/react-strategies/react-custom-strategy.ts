import type { ReactStrategyImpl, ReactStrategyImplFactory } from "../react-strategy-impl.js";
import { ReactDefaultStrategy } from "./react-default-strategy.js";

export class ReactCustomStrategy extends ReactDefaultStrategy {
  constructor(implOrImplFactory: ReactStrategyImpl | ReactStrategyImplFactory) {
    super(implOrImplFactory);
    void implOrImplFactory;
  }
}

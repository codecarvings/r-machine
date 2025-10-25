import { Strategy } from "r-machine/strategy";
import type { ReactImplPackage } from "./react-impl.js";

export abstract class ReactStrategy<C> extends Strategy<C> {
  protected abstract getImplPackage(): ReactImplPackage<C>;
  static getImplPackage<C>(strategy: ReactStrategy<C>): ReactImplPackage<C> {
    return strategy.getImplPackage();
  }
}

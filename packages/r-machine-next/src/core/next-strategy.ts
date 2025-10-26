import { Strategy } from "r-machine/strategy";
import type { NextClientImplPackage } from "./next-client-impl.js";

export abstract class NextStrategy<C> extends Strategy<C> {
  protected abstract getClientImplPackage(): NextClientImplPackage<C>;
  static getClientImplPackage<C>(strategy: NextStrategy<C>): NextClientImplPackage<C> {
    return strategy.getClientImplPackage();
  }
}

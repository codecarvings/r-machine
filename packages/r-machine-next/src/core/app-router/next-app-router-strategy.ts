import { NextStrategy } from "#r-machine/next/core";
import type { NextAppRouterServerImplPackage } from "./next-app-router-server-impl.js";

export abstract class NextAppRouterStrategy<C, LK extends string> extends NextStrategy<C> {
  protected abstract getServerImplPackage(): NextAppRouterServerImplPackage<C>;
  static getServerImplPackage<C, LK extends string>(
    strategy: NextAppRouterStrategy<C, LK>
  ): NextAppRouterServerImplPackage<C> {
    return strategy.getServerImplPackage();
  }

  protected abstract getLocaleKey(): LK;
  static getLocaleKey<SC, LK extends string>(strategy: NextAppRouterStrategy<SC, LK>): LK {
    return strategy.getLocaleKey();
  }
}

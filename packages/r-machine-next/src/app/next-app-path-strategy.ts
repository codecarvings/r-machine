import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { PathHelper } from "#r-machine/next/core";
import {
  type AnyNextAppPathStrategyConfig,
  NextAppPathStrategyCore,
  type PartialNextAppPathStrategyConfig,
} from "#r-machine/next/core/app";

/* NextAppPathStrategy - Cookies
 * If cookies are enabled, cookies can be set in 4 different ways:
 * 1) On client-side load (in NextAppPathClientImpl.onLoad) - required when not using the proxy
 * 2) On client-side writeLocale (in NextAppPathClientImpl.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 3) On server-side writeLocale (in NextAppPathServerImplComplement.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 4) In the proxy (in NextAppPathServerImplComplement.createProxy) - required when using the proxy and autoDetectLocale is enabled
 */

export class NextAppPathStrategy<
  A extends AnyAtlas,
  C extends AnyNextAppPathStrategyConfig,
> extends NextAppPathStrategyCore<A, C> {
  constructor(rMachine: RMachine<A>);
  constructor(rMachine: RMachine<A>, config?: PartialNextAppPathStrategyConfig<C["pathAtlas"], C["localeKey"]>);
  constructor(rMachine: RMachine<A>, config: PartialNextAppPathStrategyConfig<C["pathAtlas"], C["localeKey"]> = {}) {
    super(
      rMachine,
      {
        ...NextAppPathStrategyCore.defaultConfig,
        ...config,
      } as C,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path.client-impl.js");
        return module.createNextAppPathClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path.server-impl.js");
        return module.createNextAppPathServerImpl(rMachine, strategyConfig);
      }
    );

    const implicitDefaultLocale = this.config.implicitDefaultLocale !== "off";
    const cookie = this.config.cookie !== "off";
    if (implicitDefaultLocale && !cookie) {
      throw new RMachineError(
        'NextAppPathStrategy configuration error: "implicitDefaultLocale" option requires "cookie" to be enabled.'
      );
    }
  }

  readonly PathHelper: PathHelper<C["pathAtlas"]> = undefined!;
}

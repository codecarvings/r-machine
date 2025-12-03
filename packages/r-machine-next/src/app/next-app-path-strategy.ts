import { RMachineError } from "r-machine/errors";
import type { SwitchableOption } from "r-machine/strategy";
import type { CookieDeclaration } from "r-machine/strategy/web";
import {
  type DefaultLocaleKey,
  NextAppStrategy,
  type NextAppStrategyConfig,
  type PartialNextAppStrategyConfig,
} from "#r-machine/next/core/app";

/* NextAppPathStrategy - Cookies
 * If cookies are enabled, cookies can be set in 4 different ways:
 * 1) On client-side load (in NextAppPathClientImpl.onLoad) - required when not using the proxy
 * 2) On client-side writeLocale (in NextAppPathClientImpl.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 3) On server-side writeLocale (in NextAppPathServerImplComplement.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 4) In the proxy (in NextAppPathServerImplComplement.createProxy) - required when using the proxy and autoDetectLocale is enabled
 */

interface CustomImplicitDefaultLocale {
  readonly pathMatcher: RegExp | null;
}
type ImplicitDefaultLocaleOption = SwitchableOption | CustomImplicitDefaultLocale;

interface CustomAutoDetectLocale {
  readonly pathMatcher: RegExp | null;
}
type AutoDetectLocaleOption = SwitchableOption | CustomAutoDetectLocale;
type CookieOption = SwitchableOption | CookieDeclaration;

export interface NextAppPathStrategyConfig<LK extends string> extends NextAppStrategyConfig<LK> {
  readonly cookie: CookieOption;
  readonly lowercaseLocale: SwitchableOption;
  readonly autoDetectLocale: AutoDetectLocaleOption;
  readonly implicitDefaultLocale: ImplicitDefaultLocaleOption;
}
export interface PartialNextAppPathStrategyConfig<LK extends string> extends PartialNextAppStrategyConfig<LK> {
  readonly cookie?: CookieOption;
  readonly lowercaseLocale?: SwitchableOption;
  readonly autoDetectLocale?: AutoDetectLocaleOption;
  readonly implicitDefaultLocale?: ImplicitDefaultLocaleOption;
}

const defaultConfig: NextAppPathStrategyConfig<DefaultLocaleKey> = {
  ...NextAppStrategy.defaultConfig,
  cookie: "off",
  lowercaseLocale: "on",
  autoDetectLocale: "on",
  implicitDefaultLocale: "off",
};

export class NextAppPathStrategy<LK extends string = DefaultLocaleKey> extends NextAppStrategy<
  "path",
  LK,
  NextAppPathStrategyConfig<LK>
> {
  static override readonly defaultConfig = defaultConfig;

  constructor();
  constructor(config: PartialNextAppPathStrategyConfig<LK>);
  constructor(config: PartialNextAppPathStrategyConfig<LK> = {}) {
    super(
      "path",
      {
        ...defaultConfig,
        ...config,
      } as NextAppPathStrategyConfig<LK>,
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path.client-impl.js");
        return module.createNextAppPathClientImpl(rMachine, strategyConfig);
      },
      async (rMachine, strategyConfig) => {
        const module = await import("./next-app-path.server-impl-complement.js");
        return module.createNextAppPathServerImplComplement(rMachine, strategyConfig);
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
}

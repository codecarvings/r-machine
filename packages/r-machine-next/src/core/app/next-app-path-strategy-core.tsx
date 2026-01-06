import type { AnyAtlas } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { SwitchableOption } from "r-machine/strategy";
import type { CookieDeclaration } from "r-machine/strategy/web";
import type {
  AnyPathAtlas,
  HrefResolver,
  NextClientRMachine,
  PathParamMap,
  PathParams,
  PathSelector,
} from "#r-machine/next/core";
import type { NextAppPathServerToolset } from "./next-app-path-server-toolset.js";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "./next-app-strategy-core.js";

/* NextAppPathStrategy - Cookies
 * If cookies are enabled, cookies can be set in 4 different ways:
 * 1) On client-side load (in NextAppPathClientImpl.onLoad) - required when not using the proxy
 * 2) On client-side writeLocale (in NextAppPathClientImpl.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 3) On server-side writeLocale (in NextAppPathServerImplComplement.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 4) In the proxy (in NextAppPathServerImplComplement.createProxy) - required when using the proxy and autoDetectLocale is enabled
 */

interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<PA>;
}
type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: string,
  path: P,
  params?: PathParams<P, O>
) => string;

interface CustomImplicitDefaultLocale {
  readonly pathMatcher: RegExp | null;
}
type ImplicitDefaultLocaleOption = SwitchableOption | CustomImplicitDefaultLocale;

interface CustomAutoDetectLocale {
  readonly pathMatcher: RegExp | null;
}
type AutoDetectLocaleOption = SwitchableOption | CustomAutoDetectLocale;
type CookieOption = SwitchableOption | CookieDeclaration;

export interface NextAppPathStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends NextAppStrategyConfig<PA, LK> {
  readonly cookie: CookieOption;
  readonly lowercaseLocale: SwitchableOption;
  readonly autoDetectLocale: AutoDetectLocaleOption;
  readonly implicitDefaultLocale: ImplicitDefaultLocaleOption;
}
export type AnyNextAppPathStrategyConfig = NextAppPathStrategyConfig<any, any>;
export interface PartialNextAppPathStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends PartialNextAppStrategyConfig<PA, LK> {
  readonly cookie?: CookieOption;
  readonly lowercaseLocale?: SwitchableOption;
  readonly autoDetectLocale?: AutoDetectLocaleOption;
  readonly implicitDefaultLocale?: ImplicitDefaultLocaleOption;
}

const defaultConfig: NextAppPathStrategyConfig<
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  cookie: "off",
  lowercaseLocale: "on",
  autoDetectLocale: "on",
  implicitDefaultLocale: "off",
};

export abstract class NextAppPathStrategyCore<
  A extends AnyAtlas,
  C extends AnyNextAppPathStrategyConfig,
> extends NextAppStrategyCore<A, C> {
  static override readonly defaultConfig = defaultConfig;

  protected override validateConfig(): void {
    super.validateConfig();

    const implicitDefaultLocale = this.config.implicitDefaultLocale !== "off";
    const cookie = this.config.cookie !== "off";
    if (implicitDefaultLocale && !cookie) {
      throw new RMachineError(
        'NextAppPathStrategy configuration error: "implicitDefaultLocale" option requires "cookie" to be enabled.'
      );
    }
  }

  protected async createClientImpl() {
    const module = await import("./next-app-path.client-impl.js");
    return module.createNextAppPathClientImpl(this.rMachine, this.config, this.resolveHref);
  }

  protected async createServerImpl() {
    const module = await import("./next-app-path.server-impl.js");
    return module.createNextAppPathServerImpl(this.rMachine, this.config, this.resolveHref);
  }

  override async createServerToolset(
    NextClientRMachine: NextClientRMachine
  ): Promise<NextAppPathServerToolset<A, InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    const impl = await this.createServerImpl();
    const module = await import("./next-app-path-server-toolset.js");
    return module.createNextAppPathServerToolset(this.rMachine, impl, NextClientRMachine);
  }

  readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getPath: (locale, path, params) => this.resolveHref(true, locale, path, params),
  };

  // TODO: Implement resolveHref
  protected readonly resolveHref: HrefResolver = undefined!;
}

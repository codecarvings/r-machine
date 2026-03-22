/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { AnyFmtProvider, AnyResourceAtlas } from "r-machine";
import { RMachineConfigError } from "r-machine/errors";
import type { AnyLocale, AnyLocaleList } from "r-machine/locale";
import type { SwitchableOption } from "r-machine/strategy";
import type { CookieDeclaration } from "r-machine/strategy/web";
import {
  type AnyPathAtlasProvider,
  buildPathAtlas,
  HrefCanonicalizer,
  HrefTranslator,
  type PathParamMap,
  type PathParams,
  type PathSelector,
} from "#r-machine/next/core";
import { ERR_INVALID_STRATEGY_CONFIG } from "#r-machine/next/errors";
import type { NextAppClientRMachine } from "../next-app-client-toolset.js";
import type { NextAppNoProxyServerImpl, NextAppNoProxyServerToolset } from "../next-app-no-proxy-server-toolset.js";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "../next-app-strategy-core.js";

/* NextAppPathStrategy - Cookies
 * If cookies are enabled, cookies can be set in 4 different ways:
 * 1) On client-side load (in NextAppPathClientImpl.onLoad) - required when not using the proxy
 * 2) On client-side writeLocale (in NextAppPathClientImpl.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 3) On server-side writeLocale (in NextAppPathServerImplComplement.writeLocale) - required when implicitDefaultLocale is on (problem with double redirect on explicit path)
 * 4) In the proxy (in NextAppPathServerImplComplement.createProxy) - required when using the proxy and autoDetectLocale is enabled
 */

interface HrefHelper<L extends AnyLocale, PAP extends AnyPathAtlasProvider> {
  readonly getPath: PathComposer<L, PAP>;
}
type PathComposer<L extends AnyLocale, PAP extends AnyPathAtlasProvider> = <
  P extends PathSelector<PAP>,
  O extends PathParamMap<P>,
>(
  locale: L,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;

type LocaleLabelOption = "strict" | "lowercase";

interface CustomImplicitDefaultLocale {
  readonly pathMatcher: RegExp | null;
}
type ImplicitDefaultLocaleOption = SwitchableOption | CustomImplicitDefaultLocale;

interface CustomAutoDetectLocale {
  readonly pathMatcher: RegExp | null;
}
type AutoDetectLocaleOption = SwitchableOption | CustomAutoDetectLocale;
type CookieOption = SwitchableOption | CookieDeclaration;

export interface NextAppPathStrategyConfig<PAP extends AnyPathAtlasProvider, LK extends string>
  extends NextAppStrategyConfig<PAP, LK> {
  readonly cookie: CookieOption;
  readonly localeLabel: LocaleLabelOption;
  readonly autoDetectLocale: AutoDetectLocaleOption;
  readonly implicitDefaultLocale: ImplicitDefaultLocaleOption;
}
export type AnyNextAppPathStrategyConfig = NextAppPathStrategyConfig<any, any>;
export interface PartialNextAppPathStrategyConfig<PAP extends AnyPathAtlasProvider, LK extends string>
  extends PartialNextAppStrategyConfig<PAP, LK> {
  readonly cookie?: CookieOption;
  readonly localeLabel?: LocaleLabelOption;
  readonly autoDetectLocale?: AutoDetectLocaleOption;
  readonly implicitDefaultLocale?: ImplicitDefaultLocaleOption;
}

const defaultConfig: NextAppPathStrategyConfig<
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  cookie: "off",
  localeLabel: "lowercase",
  autoDetectLocale: "on",
  implicitDefaultLocale: "off",
};

export abstract class NextAppPathStrategyCore<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
  C extends AnyNextAppPathStrategyConfig,
> extends NextAppStrategyCore<RA, L, FP, C> {
  static override readonly defaultConfig = defaultConfig;

  protected readonly pathAtlas = buildPathAtlas(this.config.PathAtlas, true);
  protected readonly pathTranslator = new NextAppPathStrategyPathTranslator(
    this.pathAtlas,
    this.rMachine.locales,
    this.rMachine.defaultLocale,
    this.config.localeLabel === "lowercase",
    this.config.implicitDefaultLocale !== "off"
  );
  // Used by proxy to rewrite incoming requests
  protected readonly contentPathCanonicalizer = new HrefCanonicalizer(
    this.pathAtlas,
    this.rMachine.locales,
    this.rMachine.defaultLocale
  );
  // Used by setLocale to keep the content path when changing locale
  protected readonly pathCanonicalizer = new NextAppPathStrategyPathCanonicalizer(
    this.pathAtlas,
    this.rMachine.locales,
    this.rMachine.defaultLocale,
    this.config.implicitDefaultLocale !== "off"
  );

  protected override validateConfig(): void {
    super.validateConfig();

    const implicitDefaultLocale = this.config.implicitDefaultLocale !== "off";
    const cookie = this.config.cookie !== "off";
    if (implicitDefaultLocale && !cookie) {
      throw new RMachineConfigError(
        ERR_INVALID_STRATEGY_CONFIG,
        'NextAppPathStrategy configuration error: "implicitDefaultLocale" option requires "cookie" to be enabled.'
      );
    }
  }

  protected async createClientImpl() {
    const module = await import("./next-app-path.client-impl.js");
    return module.createNextAppPathClientImpl(this.rMachine, this.config, this.pathTranslator, this.pathCanonicalizer);
  }

  protected async createServerImpl(): Promise<NextAppNoProxyServerImpl<L, C["localeKey"]>> {
    const module = await import("./next-app-path.server-impl.js");
    return module.createNextAppPathServerImpl(
      this.rMachine,
      this.config,
      this.pathTranslator,
      this.contentPathCanonicalizer
    );
  }

  protected validateNoProxyConfig(): void {
    function raiseRequiredProxyError(optionName: string): never {
      throw new RMachineConfigError(
        ERR_INVALID_STRATEGY_CONFIG,
        `NextAppPathStrategy configuration error: "${optionName}" option requires proxy server toolset.`
      );
    }

    if (this.config.implicitDefaultLocale !== "off") {
      raiseRequiredProxyError("implicitDefaultLocale");
    }
    if (this.config.autoLocaleBinding !== "off") {
      raiseRequiredProxyError("autoLocaleBinding");
    }
    if (this.config.autoDetectLocale !== "off") {
      raiseRequiredProxyError("autoDetectLocale");
    }
    if (this.pathAtlas.containsTranslations) {
      throw new RMachineConfigError(
        ERR_INVALID_STRATEGY_CONFIG,
        "NextAppPathStrategy error: PathAtlas with translations requires proxy server toolset."
      );
    }
  }

  async createNoProxyServerToolset(
    NextClientRMachine: NextAppClientRMachine<L>
  ): Promise<NextAppNoProxyServerToolset<RA, L, FP, InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    this.validateNoProxyConfig();
    const impl = await this.createServerImpl();
    const module = await import("../next-app-no-proxy-server-toolset.js");
    return module.createNextAppNoProxyServerToolset(this.rMachine, impl, NextClientRMachine);
  }

  readonly hrefHelper: HrefHelper<L, InstanceType<C["PathAtlas"]>> = {
    getPath: (locale, path, ...args) => this.pathTranslator.get(locale, path, args[0]).value,
  };
}

export class NextAppPathStrategyPathTranslator extends HrefTranslator {
  constructor(
    atlas: AnyPathAtlasProvider,
    locales: AnyLocaleList,
    defaultLocale: AnyLocale,
    protected readonly lowercaseLocale: boolean,
    protected readonly implicitDefaultLocale: boolean
  ) {
    super(atlas, locales, defaultLocale);
  }

  protected override readonly adapter = {
    fn: (locale: AnyLocale, path: string): string => {
      if (this.implicitDefaultLocale && locale === this.defaultLocale) {
        return path;
      }
      return `/${this.lowercaseLocale ? locale.toLowerCase() : locale}${path}`;
    },
    preApply: false,
  };
}

export class NextAppPathStrategyPathCanonicalizer extends HrefCanonicalizer {
  constructor(
    atlas: AnyPathAtlasProvider,
    locales: AnyLocaleList,
    defaultLocale: AnyLocale,
    protected readonly implicitDefaultLocale: boolean
  ) {
    super(atlas, locales, defaultLocale);
  }

  protected override readonly adapter = {
    fn: (locale: AnyLocale, path: string): string => {
      if (this.implicitDefaultLocale && locale === this.defaultLocale) {
        return path;
      }
      const secondSlashIndex = path.indexOf("/", 1);
      if (secondSlashIndex === -1) {
        return "/";
      }
      return path.slice(secondSlashIndex);
    },
    preApply: true,
  };
}

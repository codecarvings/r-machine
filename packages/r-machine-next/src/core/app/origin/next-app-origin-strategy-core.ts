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

import type { AnyResAtlas, AnyResEquipment, ExperimentalFlags } from "r-machine/core";
import { RMachineConfigError } from "r-machine/errors";
import type { AnyLocale, AnyLocaleList } from "r-machine/locale";
import type { StrategyHelpers } from "r-machine/strategy";
import {
  type AnyPathAtlas,
  buildPathAtlas,
  HrefCanonicalizer,
  HrefTranslator,
  type NextClientPlugKitMap,
  type NextServerPlugKitMap,
  type PathParamMap,
  type PathParams,
  type PathSelector,
} from "#r-machine/next/core";
import {
  type NextAppStrategyConfig,
  type NextAppStrategyConfigParams,
  NextAppStrategyCore,
} from "#r-machine/next/core/app";
import { ERR_INVALID_STRATEGY_CONFIG } from "#r-machine/next/errors";
import { defaultPathMatcher } from "#r-machine/next/internal";

interface HrefHelper<L extends AnyLocale, PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<L, PA>;
  readonly getUrl: UrlComposer<L, PA>;
}
type PathComposer<L extends AnyLocale, PA extends AnyPathAtlas> = <
  P extends PathSelector<PA>,
  O extends PathParamMap<P>,
>(
  locale: L,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;
type UrlComposer<L extends AnyLocale, PA extends AnyPathAtlas> = <
  P extends PathSelector<PA>,
  O extends PathParamMap<P>,
>(
  locale: L,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;

export type LocaleOriginMap = {
  readonly [locale: AnyLocale]: string | string[];
};

export interface NextAppOriginStrategyConfig<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppStrategyConfig<RA, CKM, SKM, PA, LK> {
  readonly localeOriginMap: LocaleOriginMap;
  readonly pathMatcher: RegExp | null;
}
export type AnyNextAppOriginStrategyConfig = NextAppOriginStrategyConfig<any, any, any, any, any>;
export interface NextAppOriginStrategyConfigParams<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppStrategyConfigParams<RA, CKM, SKM, PA, LK> {
  readonly localeOriginMap: LocaleOriginMap; // Required
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppOriginStrategyConfig<
  AnyResAtlas,
  typeof NextAppStrategyCore.defaultConfig.clientKit,
  typeof NextAppStrategyCore.defaultConfig.serverKit,
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  localeOriginMap: {},
  pathMatcher: defaultPathMatcher,
};

export interface NextAppOriginStrategyHelpers<L extends AnyLocale, PA extends AnyPathAtlas> extends StrategyHelpers<L> {
  readonly hrefHelper: HrefHelper<L, PA>;
}

export abstract class NextAppOriginStrategyCore<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyNextAppOriginStrategyConfig,
> extends NextAppStrategyCore<RA, L, E, EF, C> {
  static override readonly defaultConfig = defaultConfig;

  protected readonly pathAtlas = buildPathAtlas(this.config.PathAtlas, true);
  protected readonly pathTranslator = new HrefTranslator(
    this.pathAtlas,
    this.rMachine.localeHelper.locales,
    this.rMachine.localeHelper.defaultLocale
  );
  protected readonly urlTranslator = new NextAppOriginStrategyUrlTranslator(
    this.pathAtlas,
    this.rMachine.localeHelper.locales,
    this.rMachine.localeHelper.defaultLocale,
    this.config.localeOriginMap
  );
  protected readonly pathCanonicalizer = new HrefCanonicalizer(
    this.pathAtlas,
    this.rMachine.localeHelper.locales,
    this.rMachine.localeHelper.defaultLocale
  );

  protected async createClientImpl() {
    const module = await import("./next-app-origin.client-impl.js");
    return module.createNextAppOriginClientImpl(
      this.rMachine,
      this.config,
      this.pathTranslator,
      this.urlTranslator,
      this.pathCanonicalizer
    );
  }

  protected async createServerImpl() {
    const module = await import("./next-app-origin.server-impl.js");
    return module.createNextAppOriginServerImpl(
      this.rMachine,
      this.config,
      this.pathTranslator,
      this.urlTranslator,
      this.pathCanonicalizer
    );
  }

  protected readonly hrefHelper: HrefHelper<L, InstanceType<C["PathAtlas"]>> = {
    getPath: (locale, path, ...args) => this.pathTranslator.get(locale, path, args[0]).value,
    getUrl: (locale, path, ...args) => this.urlTranslator.get(locale, path, args[0]).value,
  };

  override getHelpers(): NextAppOriginStrategyHelpers<L, InstanceType<C["PathAtlas"]>> {
    if (!this._helpers) {
      this._helpers = {
        ...super.getHelpers(),
        hrefHelper: this.hrefHelper,
      };
    }
    return this._helpers as NextAppOriginStrategyHelpers<L, InstanceType<C["PathAtlas"]>>;
  }
}

export class NextAppOriginStrategyUrlTranslator extends HrefTranslator {
  constructor(
    atlas: AnyPathAtlas,
    locales: AnyLocaleList,
    defaultLocale: AnyLocale,
    protected readonly localeOriginMap: LocaleOriginMap
  ) {
    super(atlas, locales, defaultLocale);
    locales.forEach((locale) => {
      const originOrOrigins = localeOriginMap[locale];
      if (Array.isArray(originOrOrigins)) {
        this.localeOriginMapCache.set(locale, originOrOrigins[0]); // Use the first origin if multiple are provided
      } else {
        this.localeOriginMapCache.set(locale, originOrOrigins);
      }
    });
  }
  protected readonly localeOriginMapCache = new Map<AnyLocale, string>();

  protected override readonly adapter = {
    fn: (locale: AnyLocale, path: string): string => {
      const origin = this.localeOriginMapCache.get(locale);
      if (!origin) {
        throw new RMachineConfigError(
          ERR_INVALID_STRATEGY_CONFIG,
          `No origin defined for locale '${locale}' in localeOriginMap.`
        );
      }
      return `${origin}${path}`;
    },
    preApply: false,
  };
}

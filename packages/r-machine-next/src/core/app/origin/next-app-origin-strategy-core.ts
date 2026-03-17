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

import type { AnyResourceAtlas } from "r-machine";
import { RMachineConfigError } from "r-machine/errors";
import type { AnyLocale, AnyLocaleList } from "r-machine/locale";
import {
  type AnyPathAtlas,
  buildPathAtlas,
  HrefCanonicalizer,
  HrefTranslator,
  type PathParamMap,
  type PathParams,
  type PathSelector,
} from "#r-machine/next/core";
import { ERR_INVALID_STRATEGY_CONFIG } from "#r-machine/next/errors";
import { defaultPathMatcher } from "#r-machine/next/internal";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "../next-app-strategy-core.js";

interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<PA>;
  readonly getUrl: UrlComposer<PA>;
}
type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: AnyLocale,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;
type UrlComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: AnyLocale,
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;

export type LocaleOriginMap = {
  readonly [locale: AnyLocale]: string | string[];
};

export interface NextAppOriginStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends NextAppStrategyConfig<PA, LK> {
  readonly localeOriginMap: LocaleOriginMap;
  readonly pathMatcher: RegExp | null;
}
export type AnyNextAppOriginStrategyConfig = NextAppOriginStrategyConfig<any, any>;
export interface PartialNextAppOriginStrategyConfig<PA extends AnyPathAtlas, LK extends string>
  extends PartialNextAppStrategyConfig<PA, LK> {
  readonly localeOriginMap: LocaleOriginMap; // Required
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppOriginStrategyConfig<
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  localeOriginMap: {},
  pathMatcher: defaultPathMatcher,
};

export abstract class NextAppOriginStrategyCore<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  C extends AnyNextAppOriginStrategyConfig,
> extends NextAppStrategyCore<RA, L, C> {
  static override readonly defaultConfig = defaultConfig;

  protected readonly pathAtlas = buildPathAtlas(this.config.PathAtlas, true);
  protected readonly pathTranslator = new HrefTranslator(
    this.pathAtlas,
    this.rMachine.config.locales,
    this.rMachine.config.defaultLocale
  );
  protected readonly urlTranslator = new NextAppOriginStrategyUrlTranslator(
    this.pathAtlas,
    this.rMachine.config.locales,
    this.rMachine.config.defaultLocale,
    this.config.localeOriginMap
  );
  protected readonly pathCanonicalizer = new HrefCanonicalizer(
    this.pathAtlas,
    this.rMachine.config.locales,
    this.rMachine.config.defaultLocale
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

  readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getPath: (locale, path, ...args) => this.pathTranslator.get(locale, path, args[0]).value,
    getUrl: (locale, path, ...args) => this.urlTranslator.get(locale, path, args[0]).value,
  };
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

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

import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { StrategyHelpers } from "r-machine/strategy";
import { type CookieDeclaration, defaultCookieDeclaration } from "r-machine/strategy/web";
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
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "#r-machine/next/core/app";
import { defaultPathMatcher } from "#r-machine/next/internal";

// Locale not available for flat strategy since locale is stored in the cookie
interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<PA>;
}
type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;

export interface NextAppFlatStrategyConfig<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends NextAppStrategyConfig<RA, CKM, SKM, PA, LK> {
  readonly cookie: CookieDeclaration;
  readonly pathMatcher: RegExp | null;
}
export type AnyNextAppFlatStrategyConfig = NextAppFlatStrategyConfig<any, any, any, any, any>;
export interface PartialNextAppFlatStrategyConfig<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends PartialNextAppStrategyConfig<RA, CKM, SKM, PA, LK> {
  readonly cookie?: CookieDeclaration;
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppFlatStrategyConfig<
  AnyResAtlas,
  typeof NextAppStrategyCore.defaultConfig.clientKit,
  typeof NextAppStrategyCore.defaultConfig.serverKit,
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  cookie: defaultCookieDeclaration,
  pathMatcher: defaultPathMatcher,
};

export interface NextAppFlatStrategyHelpers<L extends AnyLocale, PA extends AnyPathAtlas> extends StrategyHelpers<L> {
  readonly hrefHelper: HrefHelper<PA>;
}

export abstract class NextAppFlatStrategyCore<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyNextAppFlatStrategyConfig,
> extends NextAppStrategyCore<RA, L, E, EF, C> {
  static override readonly defaultConfig = defaultConfig;

  protected readonly pathAtlas = buildPathAtlas(this.config.PathAtlas, false);
  protected readonly pathTranslator = new HrefTranslator(
    this.pathAtlas,
    this.rMachine.localeHelper.locales,
    this.rMachine.localeHelper.defaultLocale
  );
  protected readonly pathCanonicalizer = new HrefCanonicalizer(
    this.pathAtlas,
    this.rMachine.localeHelper.locales,
    this.rMachine.localeHelper.defaultLocale
  );
  private readonly defaultLocale = this.rMachine.localeHelper.defaultLocale;

  protected async createClientImpl() {
    const module = await import("./next-app-flat.client-impl.js");
    return module.createNextAppFlatClientImpl(this.rMachine, this.config, this.pathTranslator, this.pathCanonicalizer);
  }

  protected async createServerImpl() {
    const module = await import("./next-app-flat.server-impl.js");
    return module.createNextAppFlatServerImpl(this.rMachine, this.config, this.pathTranslator, this.pathCanonicalizer);
  }

  protected readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getPath: (path, ...args) => this.pathTranslator.get(this.defaultLocale, path, args[0]).value,
  };

  override getHelpers(): NextAppFlatStrategyHelpers<L, InstanceType<C["PathAtlas"]>> {
    if (!this._helpers) {
      this._helpers = {
        ...super.getHelpers(),
        hrefHelper: this.hrefHelper,
      };
    }
    return this._helpers as NextAppFlatStrategyHelpers<L, InstanceType<C["PathAtlas"]>>;
  }
}

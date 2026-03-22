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
import type { AnyLocale } from "r-machine/locale";
import { type CookieDeclaration, defaultCookieDeclaration } from "r-machine/strategy/web";
import {
  type AnyPathAtlasProvider,
  buildPathAtlas,
  HrefCanonicalizer,
  HrefTranslator,
  type PathParamMap,
  type PathParams,
  type PathSelector,
} from "#r-machine/next/core";
import { defaultPathMatcher } from "#r-machine/next/internal";
import {
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "../next-app-strategy-core.js";

// Locale not available for flat strategy since locale is stored in the cookie
interface HrefHelper<PAP extends AnyPathAtlasProvider> {
  readonly getPath: PathComposer<PAP>;
}
type PathComposer<PAP extends AnyPathAtlasProvider> = <P extends PathSelector<PAP>, O extends PathParamMap<P>>(
  path: P,
  ...args: [keyof PathParamMap<P>] extends [never] ? [params?: PathParams<P, O>] : [params: PathParams<P, O>]
) => string;

export interface NextAppFlatStrategyConfig<PAP extends AnyPathAtlasProvider, LK extends string>
  extends NextAppStrategyConfig<PAP, LK> {
  readonly cookie: CookieDeclaration;
  readonly pathMatcher: RegExp | null;
}
export type AnyNextAppFlatStrategyConfig = NextAppFlatStrategyConfig<any, any>;
export interface PartialNextAppFlatStrategyConfig<PAP extends AnyPathAtlasProvider, LK extends string>
  extends PartialNextAppStrategyConfig<PAP, LK> {
  readonly cookie?: CookieDeclaration;
  readonly pathMatcher?: RegExp | null;
}

const defaultConfig: NextAppFlatStrategyConfig<
  InstanceType<typeof NextAppStrategyCore.defaultConfig.PathAtlas>,
  typeof NextAppStrategyCore.defaultConfig.localeKey
> = {
  ...NextAppStrategyCore.defaultConfig,
  cookie: defaultCookieDeclaration,
  pathMatcher: defaultPathMatcher,
};

export abstract class NextAppFlatStrategyCore<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
  C extends AnyNextAppFlatStrategyConfig,
> extends NextAppStrategyCore<RA, L, FP, C> {
  static override readonly defaultConfig = defaultConfig;

  protected readonly pathAtlas = buildPathAtlas(this.config.PathAtlas, false);
  protected readonly pathTranslator = new HrefTranslator(
    this.pathAtlas,
    this.rMachine.locales,
    this.rMachine.defaultLocale
  );
  protected readonly pathCanonicalizer = new HrefCanonicalizer(
    this.pathAtlas,
    this.rMachine.locales,
    this.rMachine.defaultLocale
  );
  private readonly defaultLocale = this.rMachine.defaultLocale;

  protected async createClientImpl() {
    const module = await import("./next-app-flat.client-impl.js");
    return module.createNextAppFlatClientImpl(this.rMachine, this.config, this.pathTranslator, this.pathCanonicalizer);
  }

  protected async createServerImpl() {
    const module = await import("./next-app-flat.server-impl.js");
    return module.createNextAppFlatServerImpl(this.rMachine, this.config, this.pathTranslator, this.pathCanonicalizer);
  }

  readonly hrefHelper: HrefHelper<InstanceType<C["PathAtlas"]>> = {
    getPath: (path, ...args) => this.pathTranslator.get(this.defaultLocale, path, args[0]).value,
  };
}

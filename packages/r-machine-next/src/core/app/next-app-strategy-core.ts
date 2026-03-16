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

import type { AnyLocale, AnyResourceAtlas } from "r-machine";
import { Strategy, type SwitchableOption } from "r-machine/strategy";
import type { AnyPathAtlas, ExtendedPathAtlas, PathAtlasCtor } from "#r-machine/next/core";
import type { NextAppClientImpl, NextAppClientRMachine, NextAppClientToolset } from "./next-app-client-toolset.js";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

export interface NextAppStrategyConfig<PA extends AnyPathAtlas, LK extends string> {
  readonly PathAtlas: PathAtlasCtor<PA>;
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export type AnyNextAppStrategyConfig = NextAppStrategyConfig<any, any>;
export interface PartialNextAppStrategyConfig<PA extends AnyPathAtlas, LK extends string> {
  readonly PathAtlas?: PathAtlasCtor<PA>;
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

// Need to export otherwise TS will expose the type as { decl: any; }
export class DefaultPathAtlas {
  readonly decl: any = {};
}
const defaultLocaleKey = "locale" as const;
const defaultConfig: NextAppStrategyConfig<DefaultPathAtlas, typeof defaultLocaleKey> = {
  PathAtlas: DefaultPathAtlas,
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategyCore<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  C extends AnyNextAppStrategyConfig,
> extends Strategy<RA, L, C> {
  static readonly defaultConfig = defaultConfig;

  protected abstract readonly pathAtlas: ExtendedPathAtlas<InstanceType<C["PathAtlas"]>>;

  protected abstract createClientImpl(): Promise<NextAppClientImpl<L>>;
  protected abstract createServerImpl(): Promise<NextAppServerImpl<L>>;

  async createClientToolset(): Promise<NextAppClientToolset<RA, L, InstanceType<C["PathAtlas"]>>> {
    const impl = await this.createClientImpl();
    const module = await import("./next-app-client-toolset.js");
    return module.createNextAppClientToolset(this.rMachine, impl);
  }

  async createServerToolset(
    NextClientRMachine: NextAppClientRMachine<L>
  ): Promise<NextAppServerToolset<RA, L, InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    const impl = await this.createServerImpl();
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  }
}

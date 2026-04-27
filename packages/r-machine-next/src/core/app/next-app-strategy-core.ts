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

import type { AnyResAtlas, ExperimentalFlags, ResEquipment, SwitchableOption } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { Strategy } from "r-machine/strategy";
import type {
  AnyPathAtlas,
  BuiltPathAtlas,
  NextClientPlugKitMap,
  NextServerPlugKitMap,
  PathAtlasClass,
} from "#r-machine/next/core";
import type { NextAppClientImpl, NextAppClientRMachine, NextAppClientToolset } from "./next-app-client-toolset.js";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

export interface NextAppStrategyConfig<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  readonly clientKit: CKM;
  readonly serverKit: SKM;
  readonly PathAtlas: PathAtlasClass<PA>;
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
}
export type AnyNextAppStrategyConfig = NextAppStrategyConfig<any, any, any, any, any>;
export interface PartialNextAppStrategyConfig<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  readonly clientKit?: CKM;
  readonly serverKit?: SKM;
  readonly PathAtlas?: PathAtlasClass<PA>;
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
}

const defaultKit = {} as const;
// Need to export otherwise TS will expose the type as { segment: any; }
export class DefaultPathAtlas {
  readonly segment: any = {};
}
const defaultLocaleKey = "locale" as const;
const defaultConfig: NextAppStrategyConfig<
  AnyResAtlas,
  typeof defaultKit,
  typeof defaultKit,
  DefaultPathAtlas,
  typeof defaultLocaleKey
> = {
  clientKit: defaultKit,
  serverKit: defaultKit,
  PathAtlas: DefaultPathAtlas,
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
};

export abstract class NextAppStrategyCore<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyNextAppStrategyConfig,
> extends Strategy<RA, L, E, EF, C> {
  static readonly defaultConfig = defaultConfig;

  protected abstract readonly pathAtlas: BuiltPathAtlas<InstanceType<C["PathAtlas"]>>;

  protected abstract createClientImpl(): Promise<NextAppClientImpl<L>>;
  protected abstract createServerImpl(): Promise<NextAppServerImpl<L, C["localeKey"]>>;

  async createClientToolset(): Promise<NextAppClientToolset<RA, L, EF, C["clientKit"], InstanceType<C["PathAtlas"]>>> {
    const impl = await this.createClientImpl();
    const module = await import("./next-app-client-toolset.js");
    return module.createNextAppClientToolset(this.rMachine, impl);
  }

  async createServerToolset(
    NextClientRMachine: NextAppClientRMachine<L>
  ): Promise<NextAppServerToolset<RA, L, C["serverKit"], InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    const impl = await this.createServerImpl();
    const module = await import("./next-app-server-toolset.js");
    return module.createNextAppServerToolset(this.rMachine, impl, NextClientRMachine);
  }
}

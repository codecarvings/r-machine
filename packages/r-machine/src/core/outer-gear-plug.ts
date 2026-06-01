/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { ActionComposer } from "./action.js";
import type { BaseGearPlugPortMap } from "./base-gear-plug.js";
import type { CmdComposer } from "./cmd.js";
import {
  createGearListPlugHead,
  createGearMapPlugHead,
  type GearListPlugHead,
  type GearMapPlugHead,
  type GearPluginCtx,
  type GearPlugKitMap,
} from "./gear-plug.js";
import type { GetterCellComposer, GetterComposer, StatelessGetterComposer } from "./getter.js";
import type { AnyState } from "./outer-gear.js";
import type { ListPlugin, MapPlugin, PlugBody } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type OuterGearPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@gear:outer">;
export type OuterGearPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@gear:outer">;

// #region Stateful

export interface StatefulOuterGearCursor<S extends AnyState> {
  readonly getter: GetterComposer<S>;
  readonly cell: GetterCellComposer;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

export type StatefulOuterGearPluginCtx<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = GearPluginCtx<RA, KM, PM> & {
  readonly state: S;
  readonly defaultState: S;
};

export type StatefulOuterGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = MapPlugin<RA, DM, StatefulOuterGearPluginCtx<RA, KM, PM, S>>;

export type StatefulOuterGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = ListPlugin<RA, DL, StatefulOuterGearPluginCtx<RA, KM, PM, S>>;

interface StatefulOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  CTX extends StatefulOuterGearPluginCtx<RA, KM, PM, S>,
  S extends AnyState,
> extends GearMapPlugHead<"outer", RA, KM, DM, PM, CTX> {
  readonly defaultState: S;
}

export function createStatefulOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  CTX extends StatefulOuterGearPluginCtx<RA, KM, PM, S>,
  S extends AnyState,
>(deps: DM, ports: PM, defaultState: S): StatefulOuterGearMapPlugHead<RA, KM, DM, PM, CTX, S> {
  return {
    ...createGearMapPlugHead<"outer", RA, KM, DM, PM, CTX>("outer", deps, ports),
    defaultState,
  } as unknown as StatefulOuterGearMapPlugHead<RA, KM, DM, PM, CTX, S>;
}

interface StatefulOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  CTX extends StatefulOuterGearPluginCtx<RA, KM, PM, S>,
  S extends AnyState,
> extends GearListPlugHead<"outer", RA, KM, DL, PM, CTX> {
  readonly defaultState: S;
}

export function createStatefulOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  CTX extends StatefulOuterGearPluginCtx<RA, KM, PM, S>,
  S extends AnyState,
>(deps: DL, ports: PM, defaultState: S): StatefulOuterGearListPlugHead<RA, KM, DL, PM, CTX, S> {
  return {
    ...createGearListPlugHead<"outer", RA, KM, DL, PM, CTX>("outer", deps, ports),
    defaultState,
  } as unknown as StatefulOuterGearListPlugHead<RA, KM, DL, PM, CTX, S>;
}

export interface StatefulOuterGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> extends PlugBody<StatefulOuterGearMapPlugHead<RA, KM, DM, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>> {}

export interface StatefulOuterGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> extends PlugBody<StatefulOuterGearListPlugHead<RA, KM, DL, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>> {}

// #endregion

// #region Stateless

// If state is not present AND no OuterGear dep is present, the then there is no need
// to provide relay and cmd composers.
export interface InertOuterGearCursor {
  readonly getter: StatelessGetterComposer;
  readonly cell: GetterCellComposer;
}

export interface StatelessOuterGearCursor {
  readonly getter: StatelessGetterComposer;
  readonly cell: GetterCellComposer;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type StatelessOuterGearPluginCtx<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  PM extends BaseGearPlugPortMap,
> = GearPluginCtx<RA, KM, PM>;

export type StatelessOuterGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = MapPlugin<RA, DM, StatelessOuterGearPluginCtx<RA, KM, PM>>;

export type StatelessOuterGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = ListPlugin<RA, DL, StatelessOuterGearPluginCtx<RA, KM, PM>>;

type StatelessOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = GearMapPlugHead<"outer", RA, KM, DM, PM, StatelessOuterGearPluginCtx<RA, KM, PM>>;

type StatelessOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = GearListPlugHead<"outer", RA, KM, DL, PM, StatelessOuterGearPluginCtx<RA, KM, PM>>;

export interface StatelessOuterGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> extends PlugBody<StatelessOuterGearMapPlugHead<RA, KM, DM, PM>> {}

export interface StatelessOuterGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> extends PlugBody<StatelessOuterGearListPlugHead<RA, KM, DL, PM>> {}

// #endregion

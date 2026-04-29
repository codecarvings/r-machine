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
import type { CmdComposer } from "./cmd.js";
import {
  createGearListPlugHead,
  createGearMapPlugHead,
  type GearListPlugHead,
  type GearMapPlugHead,
  type GearPlugKitMap,
} from "./gear-plug.js";
import type { GetterComposer, StatelessGetterComposer } from "./getter.js";
import type { AnyState } from "./outer-gear.js";
import type { ListPlugin, MapPlugin, PlugBody, PluginCtx } from "./plug.js";
import type { RelayComposer } from "./relay.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type OuterGearPlugDepMap<RA extends AnyResAtlas> = HandleMap<RA, "valid@gear:outer">;
export type OuterGearPlugDepList<RA extends AnyResAtlas> = HandleList<RA, "valid@gear:outer">;

// #region Stateful

export interface StatefulOuterGearCursor<S extends AnyState> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

export type StatefulOuterGearCtx<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, S extends AnyState> = PluginCtx<
  RA,
  KM
> & {
  readonly state: S;
  readonly defaultState: S;
};

export type StatefulOuterGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  S extends AnyState,
> = MapPlugin<RA, DM, StatefulOuterGearCtx<RA, KM, S>>;

export type StatefulOuterGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  S extends AnyState,
> = ListPlugin<RA, DL, StatefulOuterGearCtx<RA, KM, S>>;

interface StatefulOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
> extends GearMapPlugHead<"outer", RA, KM, DM, CTX> {
  readonly defaultState: S;
}

export function createStatefulOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
>(deps: DM, defaultState: S): StatefulOuterGearMapPlugHead<RA, KM, DM, CTX, S> {
  return {
    ...createGearMapPlugHead<"outer", RA, KM, DM, CTX>("outer", deps),
    defaultState,
  } as unknown as StatefulOuterGearMapPlugHead<RA, KM, DM, CTX, S>;
}

interface StatefulOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
> extends GearListPlugHead<"outer", RA, KM, DL, CTX> {
  readonly defaultState: S;
}

export function createStatefulOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  CTX extends StatefulOuterGearCtx<RA, KM, S>,
  S extends AnyState,
>(deps: DL, defaultState: S): StatefulOuterGearListPlugHead<RA, KM, DL, CTX, S> {
  return {
    ...createGearListPlugHead<"outer", RA, KM, DL, CTX>("outer", deps),
    defaultState,
  } as unknown as StatefulOuterGearListPlugHead<RA, KM, DL, CTX, S>;
}

export interface StatefulOuterGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  S extends AnyState,
> extends PlugBody<StatefulOuterGearMapPlugHead<RA, KM, DM, StatefulOuterGearCtx<RA, KM, S>, S>> {}

export interface StatefulOuterGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  S extends AnyState,
> extends PlugBody<StatefulOuterGearListPlugHead<RA, KM, DL, StatefulOuterGearCtx<RA, KM, S>, S>> {}

// #endregion

// #region Stateless

// If state is not present AND no OuterGear dep is present, the then there is no need
// to provide relay and cmd composers.
export interface InertOuterGearCursor {
  readonly getter: StatelessGetterComposer;
}

export interface StatelessOuterGearCursor {
  readonly getter: StatelessGetterComposer;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type StatelessOuterGearPluginCtx<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> = PluginCtx<RA, KM>;

export type StatelessOuterGearMapPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = MapPlugin<RA, DM, StatelessOuterGearPluginCtx<RA, KM>>;

export type StatelessOuterGearListPlugin<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = ListPlugin<RA, DL, StatelessOuterGearPluginCtx<RA, KM>>;

type StatelessOuterGearMapPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = GearMapPlugHead<"outer", RA, KM, DM, StatelessOuterGearPluginCtx<RA, KM>>;

type StatelessOuterGearListPlugHead<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = GearListPlugHead<"outer", RA, KM, DL, StatelessOuterGearPluginCtx<RA, KM>>;

export interface StatelessOuterGearMapPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> extends PlugBody<StatelessOuterGearMapPlugHead<RA, KM, DM>> {}

export interface StatelessOuterGearListPlug<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> extends PlugBody<StatelessOuterGearListPlugHead<RA, KM, DL>> {}

// #endregion

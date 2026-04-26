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

import type { GearRole } from "./gear.js";
import type { PlugBody, PluginCtx } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import { getNamespaceList, type HandleList } from "./res-list.js";
import { getNamespaceMap, type HandleMap } from "./res-map.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";

export interface GearMapPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends PluginCtx<RA, KM>,
> extends ResMapPlugHead<"gear", RA, KM, DM, CTX> {
  readonly role: R;
}
type AnyGearMapPlugHead = GearMapPlugHead<GearRole, any, any, any, any>;

export function createGearMapPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends PluginCtx<RA, KM>,
>(role: R, deps: DM): GearMapPlugHead<R, RA, KM, DM, CTX> {
  const nsDeps = getNamespaceMap(deps);
  const nsDepList = Object.values(nsDeps);
  return {
    area: "res",
    mode: "map",
    family: "gear",
    role,
    deps,
    nsDeps,
    nsDepList,
  } as unknown as GearMapPlugHead<R, RA, KM, DM, CTX>;
}

export interface GearListPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends PluginCtx<RA, KM>,
> extends ResListPlugHead<"gear", RA, KM, DL, CTX> {
  readonly role: R;
}
type AnyGearListPlugHead = GearListPlugHead<GearRole, any, any, any, any>;

export function createGearListPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends PluginCtx<RA, KM>,
>(role: R, deps: DL): GearListPlugHead<R, RA, KM, DL, CTX> {
  const nsDeps = getNamespaceList(deps);
  return {
    area: "res",
    mode: "list",
    family: "gear",
    role,
    deps,
    nsDeps,
    nsDepList: nsDeps,
  } as unknown as GearListPlugHead<R, RA, KM, DL, CTX>;
}

export type AnyGearPlugHead = AnyGearMapPlugHead | AnyGearListPlugHead;
export type AnyGearPlug = PlugBody<AnyGearPlugHead>;

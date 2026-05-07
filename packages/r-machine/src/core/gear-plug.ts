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

import type { NamespaceMap } from "#r-machine/core";
import type { PlugBody } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import {
  type AnyPortMap,
  createResListPlugHead,
  createResMapPlugHead,
  type ResListPlugHead,
  type ResMapPlugHead,
  type ResPluginCtx,
} from "./res-plug.js";

export type GearRole = "inner" | "base" | "outer";

export type GearPlugKitMap<RA extends AnyResAtlas> = NamespaceMap<RA, "shape@gear:base">;

export type GearPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>, PM extends AnyPortMap> = ResPluginCtx<
  RA,
  KM,
  PM
>;

export interface GearMapPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HandleMap<RA>,
  PM extends AnyPortMap,
  CTX extends GearPluginCtx<RA, KM, PM>,
> extends ResMapPlugHead<"gear", RA, KM, DM, PM, CTX> {
  readonly role: R;
}
type AnyGearMapPlugHead = GearMapPlugHead<GearRole, any, any, any, any, any>;

export function createGearMapPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HandleMap<RA>,
  PM extends AnyPortMap,
  CTX extends GearPluginCtx<RA, KM, PM>,
>(role: R, deps: DM, ports: PM): GearMapPlugHead<R, RA, KM, DM, PM, CTX> {
  return {
    ...createResMapPlugHead<"gear", RA, KM, DM, PM, CTX>("gear", deps, ports),
    role,
  } as unknown as GearMapPlugHead<R, RA, KM, DM, PM, CTX>;
}

export interface GearListPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HandleList<RA>,
  PM extends AnyPortMap,
  CTX extends GearPluginCtx<RA, KM, PM>,
> extends ResListPlugHead<"gear", RA, KM, DL, PM, CTX> {
  readonly role: R;
}
type AnyGearListPlugHead = GearListPlugHead<GearRole, any, any, any, any, any>;

export function createGearListPlugHead<
  R extends GearRole,
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HandleList<RA>,
  PM extends AnyPortMap,
  CTX extends GearPluginCtx<RA, KM, PM>,
>(role: R, deps: DL, ports: PM): GearListPlugHead<R, RA, KM, DL, PM, CTX> {
  return {
    ...createResListPlugHead<"gear", RA, KM, DL, PM, CTX>("gear", deps, ports),
    role,
  } as unknown as GearListPlugHead<R, RA, KM, DL, PM, CTX>;
}

export type AnyGearPlugHead = AnyGearMapPlugHead | AnyGearListPlugHead;
export type AnyGearPlug = PlugBody<AnyGearPlugHead>;

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

import type { PlugBody, PluginCtx } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import { createResListPlugHead, createResMapPlugHead, type ResListPlugHead, type ResMapPlugHead } from "./res-plug.js";

export type GearRole = "inner" | "hub" | "outer";

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
  return {
    ...createResMapPlugHead<"gear", RA, KM, DM, CTX>("gear", deps),
    role,
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
  return {
    ...createResListPlugHead<"gear", RA, KM, DL, CTX>("gear", deps),
    role,
  } as unknown as GearListPlugHead<R, RA, KM, DL, CTX>;
}

export type AnyGearPlugHead = AnyGearMapPlugHead | AnyGearListPlugHead;
export type AnyGearPlug = PlugBody<AnyGearPlugHead>;

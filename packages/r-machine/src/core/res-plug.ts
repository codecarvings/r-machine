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

import type { ListPlugHead, MapPlugHead, PlugBody, PluginCtx } from "./plug.js";
import type { ResFamily } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { KitDepLists } from "./res-equipment.js";
import { getNamespaceList, type HandleList } from "./res-list.js";
import { getNamespaceMap, type HandleMap } from "./res-map.js";

export interface ResMapPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends PluginCtx<RA, KM>,
> extends MapPlugHead<"res", RA, KM, DM, CTX> {
  readonly family: F;
}
type AnyResMapPlugHead = ResMapPlugHead<ResFamily, any, any, any, any>;

export function createResMapPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends PluginCtx<RA, KM>,
>(family: F, deps: DM, kitDepLists: KitDepLists): ResMapPlugHead<F, RA, KM, DM, CTX> {
  const nsDeps = getNamespaceMap(deps);
  const nsDepList = [...new Set([...Object.values(nsDeps), ...kitDepLists[family]])];

  return {
    area: "res",
    mode: "map",
    family,
    deps,
    nsDeps,
    nsDepList,
  } as unknown as ResMapPlugHead<F, RA, KM, DM, CTX>;
}

export interface ResListPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends PluginCtx<RA, KM>,
> extends ListPlugHead<"res", RA, KM, DL, CTX> {
  readonly family: F;
}
type AnyResListPlugHead = ResListPlugHead<ResFamily, any, any, any, any>;

export function createResListPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends PluginCtx<RA, KM>,
>(family: F, deps: DL, kitDepLists: KitDepLists): ResListPlugHead<F, RA, KM, DL, CTX> {
  const nsDeps = getNamespaceList(deps);
  const nsDepList = [...new Set([...nsDeps, ...kitDepLists[family]])];

  return {
    area: "res",
    mode: "list",
    family,
    deps,
    nsDeps,
    nsDepList,
  } as unknown as ResListPlugHead<F, RA, KM, DL, CTX>;
}

export type AnyResPlugHead = AnyResMapPlugHead | AnyResListPlugHead;
export type AnyResPlug = PlugBody<AnyResPlugHead>;

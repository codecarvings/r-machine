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

import type { PlugBody, PlugHead, PlugMode } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

interface ResPlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
> extends PlugHead<"res", M, RA, KA, NS> {}

export interface ResMapPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>
  extends PlugBody<ResPlugHead<"map", RA, KA, NM>> {}

export interface ResListPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>
  extends PlugBody<ResPlugHead<"list", RA, KA, NL>> {}

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

export interface StatefulResPlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA> | NamespaceList<RA>,
  S extends AnyState,
> extends ResPlugHead<M, RA, KA, NM> {
  readonly defaultState: S;
}

export interface StatefulResMapPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> extends PlugBody<StatefulResPlugHead<"map", RA, KA, NM, S>> {}

export interface StatefulResListPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> extends PlugBody<StatefulResPlugHead<"list", RA, KA, NL, S>> {}

export type AnyResPlug =
  | ResMapPlug<any, any, any>
  | ResListPlug<any, any, any>
  | StatefulResMapPlug<any, any, any, any>
  | StatefulResListPlug<any, any, any, any>;

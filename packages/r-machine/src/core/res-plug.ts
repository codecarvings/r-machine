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

import type { BasePlugDescriptor } from "./base-plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

type ResPlugKind = "map" | "list";

interface ResPlugDescriptor<
  K extends ResPlugKind,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  S extends AnyState,
> extends BasePlugDescriptor<RA, KA, NS> {
  readonly kind: K;
  readonly defaultState: S;
}

const resPlugDescriptor = Symbol("resPlugDescriptor");
interface ResPlug<
  K extends ResPlugKind,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  S extends AnyState,
> {
  readonly [resPlugDescriptor]: ResPlugDescriptor<K, RA, KA, NS, S>;
}

export function getResPlugDescriptor<P extends AnyResPlug>(plug: P): P[typeof resPlugDescriptor] {
  return plug[resPlugDescriptor];
}

export type AnyResPlug = ResPlug<any, any, any, any, any>;

declare const noState: unique symbol;
export interface ResMapPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>
  extends ResPlug<"map", RA, KA, NM, typeof noState> {}

export interface ResListPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>
  extends ResPlug<"list", RA, KA, NL, typeof noState> {}

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

export interface StatefulResMapPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> extends ResPlug<"map", RA, KA, NM, S> {}

export interface StatefulResListPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> extends ResPlug<"list", RA, KA, NL, S> {}

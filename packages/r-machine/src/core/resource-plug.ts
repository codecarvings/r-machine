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

type PlugKind = "map" | "list";

interface ResourcePlugDescriptor<
  K extends PlugKind,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  S extends AnyState,
> extends BasePlugDescriptor<RA, KA, NS> {
  readonly kind: K;
  readonly defaultState: S;
}

const resourcePlugDescriptor = Symbol("resourcePlugDescriptor");
interface ResourcePlug<
  K extends PlugKind,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  S extends AnyState,
> {
  readonly [resourcePlugDescriptor]: ResourcePlugDescriptor<K, RA, KA, NS, S>;
}

export function getResourcePlugDescriptor<P extends AnyResourcePlug>(plug: P): P[typeof resourcePlugDescriptor] {
  return plug[resourcePlugDescriptor];
}

export type AnyResourcePlug = ResourcePlug<any, any, any, any, any>;

declare const noState: unique symbol;
export interface ResourceMapPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>
  extends ResourcePlug<"map", RA, KA, NM, typeof noState> {}

export interface ResourceListPlug<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>
  extends ResourcePlug<"list", RA, KA, NL, typeof noState> {}

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

export interface StatefulResourceMapPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> extends ResourcePlug<"map", RA, KA, NM, S> {}

export interface StatefulResourceListPlug<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> extends ResourcePlug<"list", RA, KA, NL, S> {}

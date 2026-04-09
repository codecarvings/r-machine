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

import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceList } from "./resource-list.js";
import type { NamespaceMap } from "./resource-map.js";

declare const resourcePlugKind: unique symbol;
declare const resourcePlugTypes: unique symbol;
interface ResourcePlug<K extends string, T> {
  readonly [resourcePlugKind]: K;
  readonly [resourcePlugTypes]: T;
}

export type AnyResourcePlug = ResourcePlug<string, unknown>;

export interface ResourceMapPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>
  extends ResourcePlug<"map", [RA, KA, NM]> {}

export interface ResourceListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> extends ResourcePlug<"list", [RA, KA, NL]> {}

export type AnyState = unknown; // Record<PropertyKey, unknown> & object;

export interface StatefulResourceMapPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> extends ResourcePlug<"statefulMap", [RA, KA, NM, S]> {}

export interface StatefulResourceListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> extends ResourcePlug<"statefulList", [RA, KA, NL, S]> {}

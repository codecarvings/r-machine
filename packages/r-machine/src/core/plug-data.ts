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

import type { AnyNamespace, AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

export type PlugArea = "res" | "gate";
export type PlugMode = "map" | "list";

export interface PlugData<
  A extends PlugArea,
  M extends PlugMode,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
> {
  readonly area: A;
  readonly mode: M;
  readonly kit: KA;
  readonly namespaces: NS;
  readonly deps: AnyNamespace[];
}
export type AnyPlugData = PlugData<any, any, any, any, any>;

const plugData = Symbol("plugData");
export interface PlugDataProvider<PD extends AnyPlugData> {
  readonly [plugData]: PD;
}

export type AnyPlugDataProvider = PlugDataProvider<any>;

export function getPlugData<P extends AnyPlugDataProvider>(plug: P): P[typeof plugData] {
  return plug[plugData];
}

export function createPlugDataProvider<B extends object, PD extends AnyPlugData>(
  base: B,
  data: PD
): B & PlugDataProvider<PD> {
  return Object.assign({}, base, {
    [plugData]: data,
  });
}

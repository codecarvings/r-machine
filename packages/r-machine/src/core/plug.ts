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

export interface PlugHead<
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
export type AnyPlugHead = PlugHead<any, any, any, any, any>;

const plugHead = Symbol("plugHead");
export interface PlugBody<PH extends AnyPlugHead> {
  readonly [plugHead]: PH;
}

export type AnyPlugBody = PlugBody<AnyPlugHead>;

export function getPlugHead<P extends AnyPlugBody>(plug: P): P[typeof plugHead] {
  return plug[plugHead];
}

export function createPlugHeadProvider<B extends object, PH extends AnyPlugHead>(base: B, data: PH): B & PlugBody<PH> {
  return Object.assign({}, base, {
    [plugHead]: data,
  });
}

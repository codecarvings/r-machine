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

import type { GearCursor, GearListPlugin, GearMapPlugin } from "./gear.js";
import type { StatelessGetterComposer } from "./getter.js";
import type { AnyReactiveResource, RejectAsyncValueProperties } from "./reactive-resource.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrix } from "./res-matrix.js";
import type { ResourceListPlug, ResourceMapPlug } from "./resource-plug.js";

interface StatelessReactiveGearCursor extends GearCursor {
  readonly getter: StatelessGetterComposer;
}

export type StatelessReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
  factory: (plugin: GearMapPlugin<RA, KA, NM>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R, ResourceMapPlug<RA, KA, NM>>;

export type StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = <R extends AnyReactiveResource & RejectAsyncValueProperties<R>>(
  factory: (plugin: GearListPlugin<RA, KA, NL>, _: StatelessReactiveGearCursor) => R | Promise<R>
) => ResMatrix<R, ResourceListPlug<RA, KA, NL>>;

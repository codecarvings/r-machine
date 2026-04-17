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
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

export interface ResMapPlugHead<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  CTX extends PluginCtx<RA, KA>,
> extends MapPlugHead<"res", RA, KA, NM, CTX> {}
type AnyResMapPlugHead = ResMapPlugHead<any, any, any, any>;

export interface ResListPlugHead<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  CTX extends PluginCtx<RA, KA>,
> extends ListPlugHead<"res", RA, KA, NL, CTX> {}
type AnyResListPlugHead = ResListPlugHead<any, any, any, any>;

type AnyResPlugHead = AnyResMapPlugHead | AnyResListPlugHead;
export type AnyResPlug = PlugBody<AnyResPlugHead>;

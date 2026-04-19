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
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

export interface ResMapPlugHead<
  F extends ResFamily,
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  CTX extends PluginCtx<RD, KA>,
> extends MapPlugHead<"res", RD, KA, NM, CTX> {
  readonly family: F;
}
type AnyResMapPlugHead = ResMapPlugHead<ResFamily, any, any, any, any>;

export interface ResListPlugHead<
  F extends ResFamily,
  RD extends AnyResDomain,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  CTX extends PluginCtx<RD, KA>,
> extends ListPlugHead<"res", RD, KA, NL, CTX> {
  readonly family: F;
}
type AnyResListPlugHead = ResListPlugHead<ResFamily, any, any, any, any>;

export type AnyResPlugHead = AnyResMapPlugHead | AnyResListPlugHead;
export type AnyResPlug = PlugBody<AnyResPlugHead>;

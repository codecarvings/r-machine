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

import type { PlugBody, PlugHead, PluginCtx, PlugMode } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

export interface ResPlugHead<
  M extends PlugMode,
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
  CTX extends PluginCtx<RA, KA>,
> extends PlugHead<"res", M, RA, KA, NS, CTX> {}

type AnyResPlugHead = ResPlugHead<any, any, any, any, any>;
export type AnyResPlug = PlugBody<AnyResPlugHead>;

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

import type { AnyResAtlas } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { ListPlugHead, LocaleAwarePluginCtx, MapPlugHead } from "./plug.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type GatePluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KA extends HandleMap<RA>> = LocaleAwarePluginCtx<
  RA,
  L,
  KA
> & {
  readonly setLocale: (newLocale: L) => Promise<void>;
};

export interface GateMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends GatePluginCtx<RA, L, KA>,
> extends MapPlugHead<"gate", RA, KA, DM, CTX> {}

export interface GateListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends GatePluginCtx<RA, L, KA>,
> extends ListPlugHead<"gate", RA, KA, DL, CTX> {}

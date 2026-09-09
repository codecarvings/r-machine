/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyLocale } from "#r-machine/locale";
import type { ListPlugHead, LocaleAwarePluginCtx, MapPlugHead } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type GatePluginCtx<RA extends AnyResAtlas, L extends AnyLocale, KM extends HandleMap<RA>> = LocaleAwarePluginCtx<
  RA,
  L,
  KM
> & {
  readonly setLocale: (newLocale: L) => Promise<void>;
};

export interface GateMapPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  CTX extends GatePluginCtx<RA, L, KM>,
> extends MapPlugHead<"gate", RA, KM, DM, CTX> {}

export interface GateListPlugHead<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  CTX extends GatePluginCtx<RA, L, KM>,
> extends ListPlugHead<"gate", RA, KM, DL, CTX> {}

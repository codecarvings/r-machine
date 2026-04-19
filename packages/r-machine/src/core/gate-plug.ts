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

import type { AnyLocale } from "#r-machine/locale";
import type { ListPlugHead, LocaleAwarePluginCtx, MapPlugHead } from "./plug.js";
import type { AnyResDomain } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";

export type GatePluginCtx<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
> = LocaleAwarePluginCtx<RD, L, KA> & {
  readonly setLocale: (newLocale: L) => Promise<void>;
};

export interface GateMapPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NM extends NamespaceMap<RD>,
  CTX extends GatePluginCtx<RD, L, KA>,
> extends MapPlugHead<"gate", RD, KA, NM, CTX> {}

export interface GateListPlugHead<
  RD extends AnyResDomain,
  L extends AnyLocale,
  KA extends NamespaceMap<RD>,
  NL extends NamespaceList<RD>,
  CTX extends GatePluginCtx<RD, L, KA>,
> extends ListPlugHead<"gate", RD, KA, NL, CTX> {}

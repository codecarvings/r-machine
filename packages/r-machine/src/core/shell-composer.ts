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
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList, ShellNamespaceList } from "./res-list.js";
import type { NamespaceMap, ShellNamespaceMap } from "./res-map.js";
import type { ShellListDefiner, ShellMapDefiner } from "./shell.js";

export interface ShellComposer<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  readonly deps: ShellDepsComposer<RA, L, KA>;
  readonly define: ShellMapDefiner<RA, L, KA, {}>;
}

interface ShellDepsComposer<RA extends AnyResAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): ShellMapDepsComposer<RA, L, KA, {}>;
  <NL extends ShellNamespaceList<RA>>(...namespaces: NL): ShellListDepsComposer<RA, L, KA, NL>;
  <NM extends ShellNamespaceMap<RA>>(namespaces: NM): ShellMapDepsComposer<RA, L, KA, NM>;
}

interface ShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly define: ShellMapDefiner<RA, L, KA, NM>;
}

interface ShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly define: ShellListDefiner<RA, L, KA, NL>;
}

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
import type { AnyResAtlas, AnyResAtlasInstance, NamespaceRef } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ShellListDefiner, ShellMapDefiner } from "./shell.js";

// The union of namespaces accepted by `Shell.deps(...)`: all shell namespaces
// from the atlas, plus any bridgeGear namespace declared in the config. The
// filter is applied to `.deps()` only — surface resolution still uses
// ATLAS["res"] so bridgeGear lookups (gear namespaces) resolve correctly.
type ShellDepsNamespace<ATLAS extends AnyResAtlasInstance, BG extends readonly string[]> =
  | Extract<keyof ATLAS["shell"], string>
  | BG[number];

// A ShellComposer drives three .deps() overloads (none / list / map) plus a
// direct .define. BG is the bridgeGears tuple: its members are added to the
// set of namespaces accepted by `.deps()` and surfaced as `bridge.*` in the
// plugin context (see shell.ts BridgeCtx).
export interface ShellComposer<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  KA extends NamespaceMap<ATLAS["res"]>,
  BG extends readonly string[] = readonly [],
> {
  readonly deps: ShellDepsComposer<ATLAS, L, KA, BG>;
  readonly define: ShellMapDefiner<ATLAS["res"], L, KA, {}, BG>;
}

interface ShellDepsComposer<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  KA extends NamespaceMap<ATLAS["res"]>,
  BG extends readonly string[],
> {
  (): ShellMapDepsComposer<ATLAS["res"], L, KA, {}, BG>;
  <NL extends readonly NamespaceRef<Pick<ATLAS["res"], ShellDepsNamespace<ATLAS, BG> & keyof ATLAS["res"]>>[]>(
    ...namespaces: NL
  ): ShellListDepsComposer<ATLAS["res"], L, KA, NL, BG>;
  <
    NM extends {
      readonly [k: string]: NamespaceRef<Pick<ATLAS["res"], ShellDepsNamespace<ATLAS, BG> & keyof ATLAS["res"]>>;
    },
  >(
    namespaces: NM
  ): ShellMapDepsComposer<ATLAS["res"], L, KA, NM, BG>;
}

interface ShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  BG extends readonly string[],
> {
  readonly define: ShellMapDefiner<RA, L, KA, NM, BG>;
}

interface ShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  BG extends readonly string[],
> {
  readonly define: ShellListDefiner<RA, L, KA, NL, BG>;
}

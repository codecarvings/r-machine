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

import type { RMachineTypeError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyResAtlas, AnyResAtlasInstance, NamespaceRef } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ShellListDefiner, ShellMapDefiner } from "./shell.js";

type ShellDepsNamespace<ATLAS extends AnyResAtlasInstance, BG extends readonly string[]> =
  | Extract<keyof ATLAS["shell"], string>
  | BG[number];

type ShellDepsNamespaceRef<ATLAS extends AnyResAtlasInstance, BG extends readonly string[]> = NamespaceRef<
  Pick<ATLAS["res"], ShellDepsNamespace<ATLAS, BG> & keyof ATLAS["res"]>
>;

type ValidShellDepItem<ATLAS extends AnyResAtlasInstance, BG extends readonly string[], N> =
  N extends ShellDepsNamespaceRef<ATLAS, BG>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid shell namespace (and not declared in bridgeGears).`>
      : RMachineTypeError<"This token does not reference a valid shell namespace (or declared bridgeGear).">;

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
  <const NL extends readonly NamespaceRef<ATLAS["res"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidShellDepItem<ATLAS, BG, NL[I]> }
  ): ShellListDepsComposer<ATLAS["res"], L, KA, NL, BG>;
  <const NM extends { readonly [k: string]: NamespaceRef<ATLAS["res"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidShellDepItem<ATLAS, BG, NM[K]> }
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

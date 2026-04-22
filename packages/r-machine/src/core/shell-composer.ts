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
import { lazyGetters } from "./composer-utils.js";
import { getPlugOutline, type LocaleAwarePluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { assembleResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";
import type { ShellListDefiner, ShellMapDefiner } from "./shell.js";

type ShellDepsNamespace<RA extends AnyResAtlas, BGL extends HandleList<RA>> =
  | Extract<keyof RA["shape@shell:*"], string>
  | BGL[number];

type ShellDepsHandle<RA extends AnyResAtlas, BGL extends HandleList<RA>> = Handle<
  Pick<RA["shape"], ShellDepsNamespace<RA, BGL> & keyof RA["shape"]>
>;

type ValidShellDepItem<RA extends AnyResAtlas, BGL extends HandleList<RA>, N> =
  N extends ShellDepsHandle<RA, BGL>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid shell namespace (and not declared in bridgeGears).`>
      : RMachineTypeError<"This token does not reference a valid shell namespace (or declared bridgeGear).">;

export interface ShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends HandleList<RA>,
  KA extends HandleMap<RA>,
> {
  readonly deps: ShellDepsComposer<RA, L, BGL, KA>;
  readonly define: ShellMapDefiner<RA, L, KA, {}>;
}

interface ShellDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends HandleList<RA>,
  KA extends HandleMap<RA>,
> {
  (): ShellMapDepsComposer<RA, L, KA, {}>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidShellDepItem<RA, BGL, NL[I]> }
  ): ShellListDepsComposer<RA, L, KA, NL>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidShellDepItem<RA, BGL, NM[K]> }
  ): ShellMapDepsComposer<RA, L, KA, NM>;
}

interface ShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> {
  readonly define: ShellMapDefiner<RA, L, KA, DM>;
}

interface ShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
> {
  readonly define: ShellListDefiner<RA, L, KA, DL>;
}

// #region Runtime

const meta: ResMatrixMeta = { family: "shell", isReactive: false };

export function createShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends HandleList<RA>,
  KA extends HandleMap<RA>,
>(provider: ResWireProvider): ShellComposer<RA, L, BGL, KA> {
  const define = createShellMapDefiner<RA, L, KA, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createShellMapDepsComposer<RA, L, KA, any>(provider, mask.deps);
    } else {
      return createShellListDepsComposer<RA, L, KA, any>(provider, mask.deps);
    }
  }) as ShellDepsComposer<RA, L, BGL, KA>;

  return {
    deps,
    define,
  };
}

function createShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(provider: ResWireProvider, deps: DM): ShellMapDepsComposer<RA, L, KA, DM> {
  return lazyGetters<ShellMapDepsComposer<RA, L, KA, DM>>({
    define: () => createShellMapDefiner(provider, deps),
  });
}

function createShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(provider: ResWireProvider, deps: DL): ShellListDepsComposer<RA, L, KA, DL> {
  return lazyGetters<ShellListDepsComposer<RA, L, KA, DL>>({
    define: () => createShellListDefiner(provider, deps),
  });
}

function createShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(provider: ResWireProvider, deps: DM): ShellMapDefiner<RA, L, KA, DM> {
  type PlugHead = ResMapPlugHead<"shell", RA, KA, DM, LocaleAwarePluginCtx<RA, L, KA>>;
  const head = {
    area: "res",
    family: "shell",
    mode: "map",
    deps,
  } as PlugHead;

  return ((factory: (plugin: never) => unknown) =>
    assembleResMatrix<PlugHead, AnyRes, AnyRes>({
      provider,
      meta,
      head,
      cursor: undefined,
      userFactory: ((plugin: unknown) => factory(plugin as never)) as (
        plugin: unknown,
        cursor: never
      ) => AnyRes | Promise<AnyRes>,
    })) as ShellMapDefiner<RA, L, KA, DM>;
}

function createShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(provider: ResWireProvider, deps: DL): ShellListDefiner<RA, L, KA, DL> {
  type PlugHead = ResListPlugHead<"shell", RA, KA, DL, LocaleAwarePluginCtx<RA, L, KA>>;
  const head = {
    area: "res",
    family: "shell",
    mode: "list",
    deps,
  } as PlugHead;

  return ((factory: (plugin: never) => unknown) =>
    assembleResMatrix<PlugHead, AnyRes, AnyRes>({
      provider,
      meta,
      head,
      cursor: undefined,
      userFactory: ((plugin: unknown) => factory(plugin as never)) as (
        plugin: unknown,
        cursor: never
      ) => AnyRes | Promise<AnyRes>,
    })) as ShellListDefiner<RA, L, KA, DL>;
}

// #endregion

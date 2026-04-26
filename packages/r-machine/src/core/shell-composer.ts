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
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import { createResMatrix, type ShellMatrixMeta } from "./res-matrix.js";
import { createResListPlugHead, createResMapPlugHead } from "./res-plug.js";
import type { ShellListDefiner, ShellMapDefiner } from "./shell.js";

type ShellDepsNamespace<RA extends AnyResAtlas, BGL extends HandleList<RA>> =
  | Extract<keyof RA["shape@shell"], string>
  | BGL[number];

type ShellDepsHandle<RA extends AnyResAtlas, BGL extends HandleList<RA>> = Handle<
  Pick<RA["shape"], ShellDepsNamespace<RA, BGL> & keyof RA["shape"]>
>;

type ValidShellDepItem<RA extends AnyResAtlas, BGL extends HandleList<RA>, N> =
  N extends ShellDepsHandle<RA, BGL>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not valid for a shell plug.`>
      : RMachineTypeError<"This token does not reference a valid namespace for a shell plug.">;

export interface ShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends HandleList<RA>,
  KM extends HandleMap<RA>,
> {
  readonly deps: ShellDepsComposer<RA, L, BGL, KM>;
  readonly define: ShellMapDefiner<RA, L, KM, {}>;
}

interface ShellDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends HandleList<RA>,
  KM extends HandleMap<RA>,
> {
  (): ShellMapComposer<RA, L, KM, {}>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidShellDepItem<RA, BGL, NL[I]> }
  ): ShellListComposer<RA, L, KM, NL>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidShellDepItem<RA, BGL, NM[K]> }
  ): ShellMapComposer<RA, L, KM, NM>;
}

interface ShellMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> {
  readonly define: ShellMapDefiner<RA, L, KM, DM>;
}

interface ShellListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> {
  readonly define: ShellListDefiner<RA, L, KM, DL>;
}

// #region Runtime

const meta: ShellMatrixMeta = { family: "shell" };

const cursor = undefined;

export function createShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends HandleList<RA>,
  KM extends HandleMap<RA>,
>(connector: ResComposerConnector): ShellComposer<RA, L, BGL, KM> {
  const define = createShellMapDefiner<RA, L, KM, {}>(connector, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createShellMapDepsComposer<RA, L, KM, any>(connector, mask.deps);
    } else {
      return createShellListDepsComposer<RA, L, KM, any>(connector, mask.deps);
    }
  }) as ShellDepsComposer<RA, L, BGL, KM>;

  return {
    deps,
    define,
  };
}

function createShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(connector: ResComposerConnector, deps: DM): ShellMapComposer<RA, L, KM, DM> {
  return lazyGetters({
    define: () => createShellMapDefiner(connector, deps),
  });
}

function createShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(connector: ResComposerConnector, deps: DL): ShellListComposer<RA, L, KM, DL> {
  return lazyGetters({
    define: () => createShellListDefiner(connector, deps),
  });
}

function createShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(connector: ResComposerConnector, deps: DM): ShellMapDefiner<RA, L, KM, DM> {
  const head = createResMapPlugHead<"shell", RA, KM, DM, LocaleAwarePluginCtx<RA, L, KM>>("shell", deps);

  return (factory: (plugin: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

function createShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(connector: ResComposerConnector, deps: DL): ShellListDefiner<RA, L, KM, DL> {
  const head = createResListPlugHead<"shell", RA, KM, DL, LocaleAwarePluginCtx<RA, L, KM>>("shell", deps);

  return (factory: (plugin: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

// #endregion

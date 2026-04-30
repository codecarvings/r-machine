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
import type { BaseGearNamespaceList } from "./base-gear-plug.js";
import { lazyGetters } from "./composer-utils.js";
import { getPlugOutline, type LocaleAwarePluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type ResMatrix, type ShellMatrixMeta } from "./res-matrix.js";
import { createResListPlugHead, createResMapPlugHead } from "./res-plug.js";
import type {
  ShellListPlug,
  ShellListPlugin,
  ShellMapPlug,
  ShellMapPlugin,
  ShellPlugDepList,
  ShellPlugDepMap,
  ShellPlugKitMap,
} from "./shell-plug.js";

export interface ShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends BaseGearNamespaceList<RA>,
  KM extends ShellPlugKitMap<RA>,
> {
  readonly withDeps: ShellDepsComposer<RA, L, BGL, KM>;
  readonly define: ShellMapDefiner<RA, L, KM, {}>;
}

interface ShellDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends BaseGearNamespaceList<RA>,
  KM extends ShellPlugKitMap<RA>,
> {
  (): ShellMapComposer<RA, L, KM, {}>;
  <const DL extends ShellPlugDepList<RA, BGL>>(...deps: DL): ValidatedDepListType<DL, ShellListComposer<RA, L, KM, DL>>;
  <const DM extends ShellPlugDepMap<RA, BGL>>(deps: DM): ValidatedDepMapType<DM, ShellMapComposer<RA, L, KM, DM>>;
}

interface ShellMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
> {
  readonly define: ShellMapDefiner<RA, L, KM, DM>;
}

interface ShellListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> {
  readonly define: ShellListDefiner<RA, L, KM, DL>;
}

type ShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RA, L, KM, DM>) => R | Promise<R>
) => ResMatrix<R, ShellMapPlug<RA, L, KM, DM>>;

type ShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RA, L, KM, DL>) => R | Promise<R>
) => ResMatrix<R, ShellListPlug<RA, L, KM, DL>>;

// #region Runtime

const meta: ShellMatrixMeta = { family: "shell" };

const cursor = undefined;

export function createShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends BaseGearNamespaceList<RA>,
  KM extends ShellPlugKitMap<RA>,
>(connector: ResComposerConnector): ShellComposer<RA, L, BGL, KM> {
  const define = createShellMapDefiner<RA, L, KM, {}>(connector, {});

  const withDeps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createShellMapDepsComposer<RA, L, KM, any>(connector, mask.deps);
    } else {
      return createShellListDepsComposer<RA, L, KM, any>(connector, mask.deps);
    }
  }) as ShellDepsComposer<RA, L, BGL, KM>;

  return {
    withDeps,
    define,
  };
}

function createShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): ShellMapComposer<RA, L, KM, DM> {
  return lazyGetters({
    define: () => createShellMapDefiner(connector, deps),
  });
}

function createShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): ShellListComposer<RA, L, KM, DL> {
  return lazyGetters({
    define: () => createShellListDefiner(connector, deps),
  });
}

function createShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): ShellMapDefiner<RA, L, KM, DM> {
  const head = createResMapPlugHead<"shell", RA, KM, DM, {}, LocaleAwarePluginCtx<RA, L, KM>>("shell", deps, {});

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
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): ShellListDefiner<RA, L, KM, DL> {
  const head = createResListPlugHead<"shell", RA, KM, DL, {}, LocaleAwarePluginCtx<RA, L, KM>>("shell", deps, {});

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

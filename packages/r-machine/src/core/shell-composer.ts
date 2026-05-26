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
import { getPlugOutline } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type ResMatrix, type ShellMatrixMeta } from "./res-matrix.js";
import { type AnyResPlug, createResListPlugHead, createResMapPlugHead } from "./res-plug.js";
import type {
  ShellListPlug,
  ShellListPlugin,
  ShellMapPlug,
  ShellMapPlugin,
  ShellPlugDepList,
  ShellPlugDepMap,
  ShellPluginCtx,
  ShellPlugKitMap,
  ShellPlugPortMap,
} from "./shell-plug.js";

interface CloneOverrides<PM> {
  ports?: keyof PM extends never ? never : Partial<PM>;
}
export interface ShellResMatrix<R, P extends AnyResPlug, PM extends ShellPlugPortMap> extends ResMatrix<R, P> {
  clone(): ShellResMatrix<R, P, PM>;
  clone(overrides: CloneOverrides<PM>): ShellResMatrix<R, P, PM>;
}

export interface ShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends BaseGearNamespaceList<RA>,
  KM extends ShellPlugKitMap<RA>,
> {
  readonly withDeps: ShellDepsComposer<RA, L, BGL, KM>;
  readonly withPorts: ShellMapPortsConfigurator<RA, L, KM, {}>;
  readonly define: ShellMapDefiner<RA, L, KM, {}, {}>;
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
  readonly withPorts: ShellMapPortsConfigurator<RA, L, KM, DM>;
  readonly define: ShellMapDefiner<RA, L, KM, DM, {}>;
}

interface ShellListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> {
  readonly withPorts: ShellListPortsConfigurator<RA, L, KM, DL>;
  readonly define: ShellListDefiner<RA, L, KM, DL, {}>;
}

type ShellMapPortsConfigurator<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
> = <PM extends ShellPlugPortMap>(ports: PM) => ShellMapDefineOnlyComposer<RA, L, KM, DM, PM>;

type ShellListPortsConfigurator<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
> = <PM extends ShellPlugPortMap>(ports: PM) => ShellListDefineOnlyComposer<RA, L, KM, DL, PM>;

interface ShellMapDefineOnlyComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
  PM extends ShellPlugPortMap,
> {
  readonly define: ShellMapDefiner<RA, L, KM, DM, PM>;
}

interface ShellListDefineOnlyComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
  PM extends ShellPlugPortMap,
> {
  readonly define: ShellListDefiner<RA, L, KM, DL, PM>;
}

type ShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
  PM extends ShellPlugPortMap,
> = <R extends AnyRes>(
  factory: (plugin: ShellMapPlugin<RA, L, KM, DM, PM>) => R | Promise<R>
) => ShellResMatrix<R, ShellMapPlug<RA, L, KM, DM, PM>, PM>;

type ShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
  PM extends ShellPlugPortMap,
> = <R extends AnyRes>(
  factory: (plugin: ShellListPlugin<RA, L, KM, DL, PM>) => R | Promise<R>
) => ShellResMatrix<R, ShellListPlug<RA, L, KM, DL, PM>, PM>;

// #region Runtime

const meta: ShellMatrixMeta = { family: "shell" };

const cursor = undefined;

const emptyPorts: ShellPlugPortMap = {};

export function createShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends BaseGearNamespaceList<RA>,
  KM extends ShellPlugKitMap<RA>,
>(connector: ResComposerConnector): ShellComposer<RA, L, BGL, KM> {
  const define = createShellMapDefiner<RA, L, KM, {}, {}>(connector, {}, emptyPorts);

  const withPorts = createShellMapPortsConfigurator<RA, L, KM, {}>(connector, {});

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
    withPorts,
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
    withPorts: () => createShellMapPortsConfigurator<RA, L, KM, DM>(connector, deps),
    define: () => createShellMapDefiner<RA, L, KM, DM, {}>(connector, deps, emptyPorts),
  });
}

function createShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): ShellListComposer<RA, L, KM, DL> {
  return lazyGetters({
    withPorts: () => createShellListPortsConfigurator<RA, L, KM, DL>(connector, deps),
    define: () => createShellListDefiner<RA, L, KM, DL, {}>(connector, deps, emptyPorts),
  });
}

function createShellMapPortsConfigurator<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): ShellMapPortsConfigurator<RA, L, KM, DM> {
  return (<PM extends ShellPlugPortMap>(ports: PM) => ({
    define: createShellMapDefiner<RA, L, KM, DM, PM>(connector, deps, ports),
  })) as ShellMapPortsConfigurator<RA, L, KM, DM>;
}

function createShellListPortsConfigurator<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DL extends ShellPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): ShellListPortsConfigurator<RA, L, KM, DL> {
  return (<PM extends ShellPlugPortMap>(ports: PM) => ({
    define: createShellListDefiner<RA, L, KM, DL, PM>(connector, deps, ports),
  })) as ShellListPortsConfigurator<RA, L, KM, DL>;
}

function createShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KM extends ShellPlugKitMap<RA>,
  DM extends ShellPlugDepMap<RA>,
  PM extends ShellPlugPortMap,
>(connector: ResComposerConnector, deps: DM, ports: PM): ShellMapDefiner<RA, L, KM, DM, PM> {
  const head = createResMapPlugHead<"shell", RA, KM, DM, PM, ShellPluginCtx<RA, L, KM, PM>>("shell", deps, ports);

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
  PM extends ShellPlugPortMap,
>(connector: ResComposerConnector, deps: DL, ports: PM): ShellListDefiner<RA, L, KM, DL, PM> {
  const head = createResListPlugHead<"shell", RA, KM, DL, PM, ShellPluginCtx<RA, L, KM, PM>>("shell", deps, ports);

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

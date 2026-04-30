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

import type {
  BaseGearListPlug,
  BaseGearListPlugin,
  BaseGearMapPlug,
  BaseGearMapPlugin,
  BaseGearPlugDepList,
  BaseGearPlugDepMap,
} from "./base-gear-plug.js";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPlugKitMap } from "./gear-plug.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta, type ResMatrix } from "./res-matrix.js";

export interface BaseGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withDeps: BaseGearDepsComposer<RA, KM>;
  readonly define: BaseGearMapDefiner<RA, KM, {}>;
}

interface BaseGearDepsComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  (): BaseGearMapComposer<RA, KM, {}>;
  <const DL extends BaseGearPlugDepList<RA>>(...deps: DL): ValidatedDepListType<DL, BaseGearListComposer<RA, KM, DL>>;
  <const DM extends BaseGearPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, BaseGearMapComposer<RA, KM, DM>>;
}

interface BaseGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
> {
  readonly define: BaseGearMapDefiner<RA, KM, DM>;
}

interface BaseGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
> {
  readonly define: BaseGearListDefiner<RA, KM, DL>;
}

type BaseGearMapDefiner<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends BaseGearPlugDepMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: BaseGearMapPlugin<RA, KM, DM>) => R | Promise<R>
) => ResMatrix<R, BaseGearMapPlug<RA, KM, DM>>;

type BaseGearListDefiner<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DL extends BaseGearPlugDepList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: BaseGearListPlugin<RA, KM, DL>) => R | Promise<R>
) => ResMatrix<R, BaseGearListPlug<RA, KM, DL>>;

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "base" };

const cursor = undefined;

export function createBaseGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): BaseGearComposer<RA, KM> {
  const define = createBaseGearMapDefiner<RA, KM, {}>(connector, {});

  const withDeps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createBaseGearMapDepsComposer<RA, KM, any>(connector, mask.deps);
    } else {
      return createBaseGearListDepsComposer<RA, KM, any>(connector, mask.deps);
    }
  }) as BaseGearDepsComposer<RA, KM>;

  return {
    withDeps,
    define,
  };
}

function createBaseGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): BaseGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    define: () => createBaseGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createBaseGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): BaseGearListComposer<RA, KM, DL> {
  return lazyGetters({
    define: () => createBaseGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createBaseGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): BaseGearMapDefiner<RA, KM, DM> {
  const head = createGearMapPlugHead<"base", RA, KM, DM, PluginCtx<RA, KM>>("base", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

function createBaseGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): BaseGearListDefiner<RA, KM, DL> {
  const head = createGearListPlugHead<"base", RA, KM, DL, PluginCtx<RA, KM>>("base", deps);

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

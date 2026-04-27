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

import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPlugKitMap } from "./gear-plug.js";
import type {
  HubGearListPlug,
  HubGearListPlugin,
  HubGearMapPlug,
  HubGearMapPlugin,
  HubGearPlugDepList,
  HubGearPlugDepMap,
} from "./hub-gear-plug.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta, type ResMatrix } from "./res-matrix.js";

export interface HubGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly deps: HubGearDepsComposer<RA, KM>;
  readonly define: HubGearMapDefiner<RA, KM, {}>;
}

interface HubGearDepsComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  (): HubGearMapComposer<RA, KM, {}>;
  <const DL extends HubGearPlugDepList<RA>>(...deps: DL): ValidatedDepListType<DL, HubGearListComposer<RA, KM, DL>>;
  <const DM extends HubGearPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, HubGearMapComposer<RA, KM, DM>>;
}

interface HubGearMapComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends HubGearPlugDepMap<RA>> {
  readonly define: HubGearMapDefiner<RA, KM, DM>;
}

interface HubGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HubGearPlugDepList<RA>,
> {
  readonly define: HubGearListDefiner<RA, KM, DL>;
}

type HubGearMapDefiner<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends HubGearPlugDepMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: HubGearMapPlugin<RA, KM, DM>) => R | Promise<R>
) => ResMatrix<R, HubGearMapPlug<RA, KM, DM>>;

type HubGearListDefiner<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DL extends HubGearPlugDepList<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: HubGearListPlugin<RA, KM, DL>) => R | Promise<R>
) => ResMatrix<R, HubGearListPlug<RA, KM, DL>>;

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "hub" };

const cursor = undefined;

export function createHubGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): HubGearComposer<RA, KM> {
  const define = createHubGearMapDefiner<RA, KM, {}>(connector, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createHubGearMapDepsComposer<RA, KM, any>(connector, mask.deps);
    } else {
      return createHubGearListDepsComposer<RA, KM, any>(connector, mask.deps);
    }
  }) as HubGearDepsComposer<RA, KM>;

  return {
    deps,
    define,
  };
}

function createHubGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HubGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): HubGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    define: () => createHubGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createHubGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HubGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): HubGearListComposer<RA, KM, DL> {
  return lazyGetters({
    define: () => createHubGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createHubGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HubGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): HubGearMapDefiner<RA, KM, DM> {
  const head = createGearMapPlugHead<"hub", RA, KM, DM, PluginCtx<RA, KM>>("hub", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

function createHubGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HubGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): HubGearListDefiner<RA, KM, DL> {
  const head = createGearListPlugHead<"hub", RA, KM, DL, PluginCtx<RA, KM>>("hub", deps);

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

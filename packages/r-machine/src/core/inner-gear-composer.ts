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
  InnerGearListPlug,
  InnerGearListPlugin,
  InnerGearMapPlug,
  InnerGearMapPlugin,
  InnerGearPlugDepList,
  InnerGearPlugDepMap,
} from "./inner-gear-plug.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta, type ResMatrix } from "./res-matrix.js";

export interface InnerGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withDeps: InnerGearDepsComposer<RA, KM>;
  readonly define: InnerGearMapDefiner<RA, KM, {}>;
}

interface InnerGearDepsComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  (): InnerGearMapComposer<RA, KM, {}>;
  <const DL extends InnerGearPlugDepList<RA>>(...deps: DL): ValidatedDepListType<DL, InnerGearListComposer<RA, KM, DL>>;
  <const DM extends InnerGearPlugDepMap<RA>>(deps: DM): ValidatedDepMapType<DM, InnerGearMapComposer<RA, KM, DM>>;
}

interface InnerGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
> {
  readonly define: InnerGearMapDefiner<RA, KM, DM>;
}

interface InnerGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> {
  readonly define: InnerGearListDefiner<RA, KM, DL>;
}

type InnerGearMapDefiner<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends InnerGearPlugDepMap<RA>> = <
  R extends AnyRes,
>(
  factory: (plugin: InnerGearMapPlugin<RA, KM, DM>) => R | Promise<R>
) => ResMatrix<R, InnerGearMapPlug<RA, KM, DM>>;

type InnerGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> = <R extends AnyRes>(
  factory: (plugin: InnerGearListPlugin<RA, KM, DL>) => R | Promise<R>
) => ResMatrix<R, InnerGearListPlug<RA, KM, DL>>;

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "inner" };

const cursor = undefined;

export function createInnerGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): InnerGearComposer<RA, KM> {
  const define = createInnerGearMapDefiner<RA, KM, {}>(connector, {});

  const withDeps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createInnerGearMapDepsComposer<RA, KM, any>(connector, mask.deps);
    } else {
      return createInnerGearListDepsComposer<RA, KM, any>(connector, mask.deps);
    }
  }) as InnerGearDepsComposer<RA, KM>;

  return {
    withDeps,
    define,
  };
}

function createInnerGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): InnerGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    define: () => createInnerGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createInnerGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): InnerGearListComposer<RA, KM, DL> {
  return lazyGetters({
    define: () => createInnerGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createInnerGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): InnerGearMapDefiner<RA, KM, DM> {
  const head = createGearMapPlugHead<"inner", RA, KM, DM, PluginCtx<RA, KM>>("inner", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

function createInnerGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): InnerGearListDefiner<RA, KM, DL> {
  const head = createGearListPlugHead<"inner", RA, KM, DL, PluginCtx<RA, KM>>("inner", deps);

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

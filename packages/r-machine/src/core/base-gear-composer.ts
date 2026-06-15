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
  BaseGearPlugPortMap,
} from "./base-gear-plug.js";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPluginCtx, type GearPlugKitMap } from "./gear-plug.js";
import { type ExtractPlugin, getPlugOutline } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta, type NoExcess, type ResMatrix } from "./res-matrix.js";
import type { AnyResPlug } from "./res-plug.js";

type BaseGearCloneFn<R, P extends AnyResPlug, T extends R = R> = (
  res: R,
  plugin: ExtractPlugin<P>
) => NoExcess<R, T> | Promise<NoExcess<R, T>>;

type BaseGearWithPortsCapability<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> = keyof PM extends never
  ? unknown
  : {
      readonly withPorts: (ports: Partial<PM>) => BaseGearMatrixPortsBuilder<R, P, PM>;
    };

interface BaseGearMatrixClone<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> {
  (): BaseGearResMatrix<R, P, PM>;
  <T extends R>(fn: BaseGearCloneFn<R, P, T>): BaseGearResMatrix<R, P, PM>;
}

interface BaseGearMatrixPortsBuilder<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> {
  readonly clone: BaseGearMatrixClone<R, P, PM>;
}

type BaseGearResMatrix<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> = ResMatrix<R, P> & {
  readonly clone: BaseGearMatrixClone<R, P, PM>;
} & BaseGearWithPortsCapability<R, P, PM>;

export interface BaseGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withDeps: BaseGearDepsComposer<RA, KM>;
  readonly withPorts: BaseGearMapPortsConfigurator<RA, KM, {}>;
  readonly define: BaseGearMapDefiner<RA, KM, {}, {}>;
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
  readonly withPorts: BaseGearMapPortsConfigurator<RA, KM, DM>;
  readonly define: BaseGearMapDefiner<RA, KM, DM, {}>;
}

interface BaseGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
> {
  readonly withPorts: BaseGearListPortsConfigurator<RA, KM, DL>;
  readonly define: BaseGearListDefiner<RA, KM, DL, {}>;
}

type BaseGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => BaseGearMapDefineOnlyComposer<RA, KM, DM, PM>;

type BaseGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => BaseGearListDefineOnlyComposer<RA, KM, DL, PM>;

interface BaseGearMapDefineOnlyComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly define: BaseGearMapDefiner<RA, KM, DM, PM>;
}

interface BaseGearListDefineOnlyComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly define: BaseGearListDefiner<RA, KM, DL, PM>;
}

type BaseGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyRes>(
  factory: (plugin: BaseGearMapPlugin<RA, KM, DM, PM>) => R | Promise<R>
) => BaseGearResMatrix<R, BaseGearMapPlug<RA, KM, DM, PM>, PM>;

type BaseGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyRes>(
  factory: (plugin: BaseGearListPlugin<RA, KM, DL, PM>) => R | Promise<R>
) => BaseGearResMatrix<R, BaseGearListPlug<RA, KM, DL, PM>, PM>;

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "base" };

const cursor = undefined;

const emptyPorts: BaseGearPlugPortMap = {};

export function createBaseGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): BaseGearComposer<RA, KM> {
  const define = createBaseGearMapDefiner<RA, KM, {}, {}>(connector, {}, emptyPorts);

  const withPorts = createBaseGearMapPortsConfigurator<RA, KM, {}>(connector, {});

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
    withPorts,
    define,
  };
}

function createBaseGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): BaseGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    withPorts: () => createBaseGearMapPortsConfigurator<RA, KM, DM>(connector, deps),
    define: () => createBaseGearMapDefiner<RA, KM, DM, {}>(connector, deps, emptyPorts),
  });
}

function createBaseGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): BaseGearListComposer<RA, KM, DL> {
  return lazyGetters({
    withPorts: () => createBaseGearListPortsConfigurator<RA, KM, DL>(connector, deps),
    define: () => createBaseGearListDefiner<RA, KM, DL, {}>(connector, deps, emptyPorts),
  });
}

function createBaseGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): BaseGearMapPortsConfigurator<RA, KM, DM> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) => ({
    define: createBaseGearMapDefiner<RA, KM, DM, PM>(connector, deps, ports),
  })) as BaseGearMapPortsConfigurator<RA, KM, DM>;
}

function createBaseGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): BaseGearListPortsConfigurator<RA, KM, DL> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) => ({
    define: createBaseGearListDefiner<RA, KM, DL, PM>(connector, deps, ports),
  })) as BaseGearListPortsConfigurator<RA, KM, DL>;
}

function createBaseGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DM, ports: PM): BaseGearMapDefiner<RA, KM, DM, PM> {
  return ((factory: (plugin: never, cursor: never) => unknown) =>
    buildBaseGearMapMatrix<RA, KM, DM, PM>(
      connector,
      deps,
      ports,
      factory as (plugin: unknown) => AnyRes | Promise<AnyRes>
    )) as BaseGearMapDefiner<RA, KM, DM, PM>;
}

function buildBaseGearMapMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends BaseGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  deps: DM,
  ports: PM,
  factory: (plugin: unknown) => AnyRes | Promise<AnyRes>
): BaseGearResMatrix<AnyRes, BaseGearMapPlug<RA, KM, DM, PM>, PM> {
  const head = createGearMapPlugHead<"base", RA, KM, DM, PM, GearPluginCtx<RA, KM, PM>>("base", deps, ports);
  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor,
    userFactory: factory,
  });

  const clone = (fn?: BaseGearCloneFn<AnyRes, BaseGearMapPlug<RA, KM, DM, PM>>) =>
    buildBaseGearMapMatrix<RA, KM, DM, PM>(connector, deps, ports, composeGearFactory(factory, fn));

  const withPorts = (overrides: Partial<PM>) => ({
    clone: (fn?: BaseGearCloneFn<AnyRes, BaseGearMapPlug<RA, KM, DM, PM>>) =>
      buildBaseGearMapMatrix<RA, KM, DM, PM>(
        connector,
        deps,
        { ...ports, ...overrides } as PM,
        composeGearFactory(factory, fn)
      ),
  });

  return { ...matrix, clone, withPorts } as unknown as BaseGearResMatrix<AnyRes, BaseGearMapPlug<RA, KM, DM, PM>, PM>;
}

function createBaseGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DL, ports: PM): BaseGearListDefiner<RA, KM, DL, PM> {
  return ((factory: (plugin: never) => unknown) =>
    buildBaseGearListMatrix<RA, KM, DL, PM>(
      connector,
      deps,
      ports,
      factory as (plugin: unknown) => AnyRes | Promise<AnyRes>
    )) as BaseGearListDefiner<RA, KM, DL, PM>;
}

function buildBaseGearListMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends BaseGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  deps: DL,
  ports: PM,
  factory: (plugin: unknown) => AnyRes | Promise<AnyRes>
): BaseGearResMatrix<AnyRes, BaseGearListPlug<RA, KM, DL, PM>, PM> {
  const head = createGearListPlugHead<"base", RA, KM, DL, PM, GearPluginCtx<RA, KM, PM>>("base", deps, ports);
  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor,
    userFactory: factory,
  });

  const clone = (fn?: BaseGearCloneFn<AnyRes, BaseGearListPlug<RA, KM, DL, PM>>) =>
    buildBaseGearListMatrix<RA, KM, DL, PM>(connector, deps, ports, composeGearFactory(factory, fn));

  const withPorts = (overrides: Partial<PM>) => ({
    clone: (fn?: BaseGearCloneFn<AnyRes, BaseGearListPlug<RA, KM, DL, PM>>) =>
      buildBaseGearListMatrix<RA, KM, DL, PM>(
        connector,
        deps,
        { ...ports, ...overrides } as PM,
        composeGearFactory(factory, fn)
      ),
  });

  return { ...matrix, clone, withPorts } as unknown as BaseGearResMatrix<AnyRes, BaseGearListPlug<RA, KM, DL, PM>, PM>;
}

function composeGearFactory(
  factory: (plugin: unknown) => AnyRes | Promise<AnyRes>,
  fn: BaseGearCloneFn<AnyRes, AnyResPlug> | undefined
): (plugin: unknown) => AnyRes | Promise<AnyRes> {
  if (fn === undefined) {
    return factory;
  }
  return async (plugin: unknown) => fn(await factory(plugin), plugin as never);
}

// #endregion

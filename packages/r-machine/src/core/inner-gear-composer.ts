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

import type { BaseGearPlugPortMap } from "./base-gear-plug.js";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPluginCtx, type GearPlugKitMap } from "./gear-plug.js";
import type {
  InnerGearListPlug,
  InnerGearListPlugin,
  InnerGearMapPlug,
  InnerGearMapPlugin,
  InnerGearPlugDepList,
  InnerGearPlugDepMap,
} from "./inner-gear-plug.js";
import { type ExtractPlugin, getPlugOutline } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { ValidatedDepMapType } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta, type NoExcess, type ResMatrix } from "./res-matrix.js";
import type { AnyResPlug } from "./res-plug.js";

type InnerGearCloneFn<R, P extends AnyResPlug, T extends R = R> = (
  res: R,
  plugin: ExtractPlugin<P>
) => NoExcess<R, T> | Promise<NoExcess<R, T>>;

type InnerGearWithPortsCapability<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> = keyof PM extends never
  ? unknown
  : {
      readonly withPorts: (ports: Partial<PM>) => InnerGearMatrixPortsBuilder<R, P, PM>;
    };

interface InnerGearMatrixClone<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> {
  (): InnerGearResMatrix<R, P, PM>;
  <T extends R>(fn: InnerGearCloneFn<R, P, T>): InnerGearResMatrix<R, P, PM>;
}

interface InnerGearMatrixPortsBuilder<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> {
  readonly clone: InnerGearMatrixClone<R, P, PM>;
}

type InnerGearResMatrix<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> = ResMatrix<R, P> & {
  readonly clone: InnerGearMatrixClone<R, P, PM>;
} & InnerGearWithPortsCapability<R, P, PM>;

export interface InnerGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withDeps: InnerGearDepsComposer<RA, KM>;
  readonly withPorts: InnerGearMapPortsConfigurator<RA, KM, {}>;
  readonly define: InnerGearMapDefiner<RA, KM, {}, {}>;
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
  readonly withPorts: InnerGearMapPortsConfigurator<RA, KM, DM>;
  readonly define: InnerGearMapDefiner<RA, KM, DM, {}>;
}

interface InnerGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> {
  readonly withPorts: InnerGearListPortsConfigurator<RA, KM, DL>;
  readonly define: InnerGearListDefiner<RA, KM, DL, {}>;
}

type InnerGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => InnerGearMapDefineOnlyComposer<RA, KM, DM, PM>;

type InnerGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => InnerGearListDefineOnlyComposer<RA, KM, DL, PM>;

interface InnerGearMapDefineOnlyComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly define: InnerGearMapDefiner<RA, KM, DM, PM>;
}

interface InnerGearListDefineOnlyComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly define: InnerGearListDefiner<RA, KM, DL, PM>;
}

type InnerGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyRes>(
  factory: (plugin: InnerGearMapPlugin<RA, KM, DM, PM>) => R | Promise<R>
) => InnerGearResMatrix<R, InnerGearMapPlug<RA, KM, DM, PM>, PM>;

type InnerGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyRes>(
  factory: (plugin: InnerGearListPlugin<RA, KM, DL, PM>) => R | Promise<R>
) => InnerGearResMatrix<R, InnerGearListPlug<RA, KM, DL, PM>, PM>;

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "inner" };

const cursor = undefined;

const emptyPorts: BaseGearPlugPortMap = {};

export function createInnerGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): InnerGearComposer<RA, KM> {
  const define = createInnerGearMapDefiner<RA, KM, {}, {}>(connector, {}, emptyPorts);

  const withPorts = createInnerGearMapPortsConfigurator<RA, KM, {}>(connector, {});

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
    withPorts,
    define,
  };
}

function createInnerGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): InnerGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    withPorts: () => createInnerGearMapPortsConfigurator<RA, KM, DM>(connector, deps),
    define: () => createInnerGearMapDefiner<RA, KM, DM, {}>(connector, deps, emptyPorts),
  });
}

function createInnerGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): InnerGearListComposer<RA, KM, DL> {
  return lazyGetters({
    withPorts: () => createInnerGearListPortsConfigurator<RA, KM, DL>(connector, deps),
    define: () => createInnerGearListDefiner<RA, KM, DL, {}>(connector, deps, emptyPorts),
  });
}

function createInnerGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): InnerGearMapPortsConfigurator<RA, KM, DM> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) => ({
    define: createInnerGearMapDefiner<RA, KM, DM, PM>(connector, deps, ports),
  })) as InnerGearMapPortsConfigurator<RA, KM, DM>;
}

function createInnerGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): InnerGearListPortsConfigurator<RA, KM, DL> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) => ({
    define: createInnerGearListDefiner<RA, KM, DL, PM>(connector, deps, ports),
  })) as InnerGearListPortsConfigurator<RA, KM, DL>;
}

function createInnerGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DM, ports: PM): InnerGearMapDefiner<RA, KM, DM, PM> {
  return ((factory: (plugin: never, cursor: never) => unknown) =>
    buildInnerGearMapMatrix<RA, KM, DM, PM>(
      connector,
      deps,
      ports,
      factory as (plugin: unknown) => AnyRes | Promise<AnyRes>
    )) as InnerGearMapDefiner<RA, KM, DM, PM>;
}

function buildInnerGearMapMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends InnerGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  deps: DM,
  ports: PM,
  factory: (plugin: unknown) => AnyRes | Promise<AnyRes>
): InnerGearResMatrix<AnyRes, InnerGearMapPlug<RA, KM, DM, PM>, PM> {
  const head = createGearMapPlugHead<"inner", RA, KM, DM, PM, GearPluginCtx<RA, KM, PM>>("inner", deps, ports);
  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor,
    userFactory: factory,
  });

  const clone = (fn?: InnerGearCloneFn<AnyRes, InnerGearMapPlug<RA, KM, DM, PM>>) =>
    buildInnerGearMapMatrix<RA, KM, DM, PM>(connector, deps, ports, composeGearFactory(factory, fn));

  const withPorts = (overrides: Partial<PM>) => ({
    clone: (fn?: InnerGearCloneFn<AnyRes, InnerGearMapPlug<RA, KM, DM, PM>>) =>
      buildInnerGearMapMatrix<RA, KM, DM, PM>(
        connector,
        deps,
        { ...ports, ...overrides } as PM,
        composeGearFactory(factory, fn)
      ),
  });

  return { ...matrix, clone, withPorts } as unknown as InnerGearResMatrix<AnyRes, InnerGearMapPlug<RA, KM, DM, PM>, PM>;
}

function createInnerGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DL, ports: PM): InnerGearListDefiner<RA, KM, DL, PM> {
  return ((factory: (plugin: never) => unknown) =>
    buildInnerGearListMatrix<RA, KM, DL, PM>(
      connector,
      deps,
      ports,
      factory as (plugin: unknown) => AnyRes | Promise<AnyRes>
    )) as InnerGearListDefiner<RA, KM, DL, PM>;
}

function buildInnerGearListMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends InnerGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  deps: DL,
  ports: PM,
  factory: (plugin: unknown) => AnyRes | Promise<AnyRes>
): InnerGearResMatrix<AnyRes, InnerGearListPlug<RA, KM, DL, PM>, PM> {
  const head = createGearListPlugHead<"inner", RA, KM, DL, PM, GearPluginCtx<RA, KM, PM>>("inner", deps, ports);
  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor,
    userFactory: factory,
  });

  const clone = (fn?: InnerGearCloneFn<AnyRes, InnerGearListPlug<RA, KM, DL, PM>>) =>
    buildInnerGearListMatrix<RA, KM, DL, PM>(connector, deps, ports, composeGearFactory(factory, fn));

  const withPorts = (overrides: Partial<PM>) => ({
    clone: (fn?: InnerGearCloneFn<AnyRes, InnerGearListPlug<RA, KM, DL, PM>>) =>
      buildInnerGearListMatrix<RA, KM, DL, PM>(
        connector,
        deps,
        { ...ports, ...overrides } as PM,
        composeGearFactory(factory, fn)
      ),
  });

  return { ...matrix, clone, withPorts } as unknown as InnerGearResMatrix<
    AnyRes,
    InnerGearListPlug<RA, KM, DL, PM>,
    PM
  >;
}

function composeGearFactory(
  factory: (plugin: unknown) => AnyRes | Promise<AnyRes>,
  fn: InnerGearCloneFn<AnyRes, AnyResPlug> | undefined
): (plugin: unknown) => AnyRes | Promise<AnyRes> {
  if (fn === undefined) {
    return factory;
  }
  return async (plugin: unknown) => fn(await factory(plugin), plugin as never);
}

// #endregion

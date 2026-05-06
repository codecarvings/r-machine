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

import type { DefaultAction } from "./action.js";
import type { BaseGearPlugPortMap } from "./base-gear-plug.js";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPluginCtx, type GearPlugKitMap } from "./gear-plug.js";
import type { DefaultGetter } from "./getter.js";
import type { AnyOuterGear, AnyState, RejectAsyncValueProps } from "./outer-gear.js";
import {
  createStatefulOuterGearListPlugHead,
  createStatefulOuterGearMapPlugHead,
  type InertOuterGearCursor,
  type OuterGearPlugDepList,
  type OuterGearPlugDepMap,
  type StatefulOuterGearCursor,
  type StatefulOuterGearListPlug,
  type StatefulOuterGearListPlugin,
  type StatefulOuterGearMapPlug,
  type StatefulOuterGearMapPlugin,
  type StatefulOuterGearPluginCtx,
  type StatelessOuterGearCursor,
  type StatelessOuterGearListPlug,
  type StatelessOuterGearListPlugin,
  type StatelessOuterGearMapPlug,
  type StatelessOuterGearMapPlugin,
} from "./outer-gear-plug.js";
import { getPlugOutline } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ExtractNamespace } from "./res-domain.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { HandleMap, ValidatedDepMapType } from "./res-map.js";
import type { GearMatrixMeta, ResMatrix } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";

export interface OuterGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withDeps: OuterGearDepsComposer<RA, KM>;
  readonly withPorts: InertOuterGearMapPortsConfigurator<RA, KM, {}>;
  readonly withState: OuterGearMapStateConfigurator<RA, KM, {}, {}>;
  readonly define: InertOuterGearMapDefiner<RA, KM, {}, {}>;
}

type HasOuterGearDepInList<RA extends AnyResAtlas, DL extends OuterGearPlugDepList<RA>> =
  Extract<ExtractNamespace<DL[number]>, keyof RA["shape@gear:outer"]> extends never ? false : true;

type HasOuterGearDepInMap<RA extends AnyResAtlas, DM extends OuterGearPlugDepMap<RA>> =
  Extract<ExtractNamespace<DM[keyof DM]>, keyof RA["shape@gear:outer"]> extends never ? false : true;

interface OuterGearDepsComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  (): OuterGearMapComposer<RA, KM, {}>;
  <const DL extends OuterGearPlugDepList<RA>>(
    ...deps: DL
  ): ValidatedDepListType<
    DL,
    HasOuterGearDepInList<RA, DL> extends true
      ? OuterGearListComposer<RA, KM, DL>
      : InertOuterGearListComposer<RA, KM, DL>
  >;
  <const DM extends OuterGearPlugDepMap<RA>>(
    deps: DM
  ): ValidatedDepMapType<
    DM,
    HasOuterGearDepInMap<RA, DM> extends true ? OuterGearMapComposer<RA, KM, DM> : InertOuterGearMapComposer<RA, KM, DM>
  >;
}

interface OuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> {
  readonly withPorts: OuterGearMapPortsConfigurator<RA, KM, DM>;
  readonly withState: OuterGearMapStateConfigurator<RA, KM, DM, {}>;
  readonly define: StatelessOuterGearMapDefiner<RA, KM, DM, {}>;
}

interface OuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> {
  readonly withPorts: OuterGearListPortsConfigurator<RA, KM, DL>;
  readonly withState: OuterGearListStateConfigurator<RA, KM, DL, {}>;
  readonly define: StatelessOuterGearListDefiner<RA, KM, DL, {}>;
}

interface InertOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> {
  readonly withPorts: InertOuterGearMapPortsConfigurator<RA, KM, DM>;
  readonly withState: OuterGearMapStateConfigurator<RA, KM, DM, {}>;
  readonly define: InertOuterGearMapDefiner<RA, KM, DM, {}>;
}

interface InertOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> {
  readonly withPorts: InertOuterGearListPortsConfigurator<RA, KM, DL>;
  readonly withState: OuterGearListStateConfigurator<RA, KM, DL, {}>;
  readonly define: InertOuterGearListDefiner<RA, KM, DL, {}>;
}

// #region Ports configurators

type OuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = <const PM extends BaseGearPlugPortMap>(ports: PM) => OuterGearMapPortsComposer<RA, KM, DM, PM>;

type OuterGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <const PM extends BaseGearPlugPortMap>(ports: PM) => OuterGearListPortsComposer<RA, KM, DL, PM>;

type InertOuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = <const PM extends BaseGearPlugPortMap>(ports: PM) => InertOuterGearMapPortsComposer<RA, KM, DM, PM>;

type InertOuterGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <const PM extends BaseGearPlugPortMap>(ports: PM) => InertOuterGearListPortsComposer<RA, KM, DL, PM>;

interface OuterGearMapPortsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly withState: OuterGearMapStateConfigurator<RA, KM, DM, PM>;
  readonly define: StatelessOuterGearMapDefiner<RA, KM, DM, PM>;
}

interface OuterGearListPortsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly withState: OuterGearListStateConfigurator<RA, KM, DL, PM>;
  readonly define: StatelessOuterGearListDefiner<RA, KM, DL, PM>;
}

interface InertOuterGearMapPortsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly withState: OuterGearMapStateConfigurator<RA, KM, DM, PM>;
  readonly define: InertOuterGearMapDefiner<RA, KM, DM, PM>;
}

interface InertOuterGearListPortsComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> {
  readonly withState: OuterGearListStateConfigurator<RA, KM, DL, PM>;
  readonly define: InertOuterGearListDefiner<RA, KM, DL, PM>;
}

// #endregion

// #region State configurators

type OuterGearMapStateConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = <S extends AnyState>(defaultState: S) => StatefulOuterGearMapComposer<RA, KM, DM, PM, S>;

type OuterGearListStateConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <S extends AnyState>(defaultState: S) => StatefulOuterGearListComposer<RA, KM, DL, PM, S>;

// #endregion

// #region Stateful

interface StatefulOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  readonly define: StatefulOuterGearMapDefiner<RA, KM, DM, PM, S>;
}

interface StatefulOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  readonly define: StatefulOuterGearListDefiner<RA, KM, DL, PM, S>;
}

type ReadableOuterGearResource<S extends AnyState, G extends string> = { [P in G]: DefaultGetter<S> };
type WritableOuterGearResource<S extends AnyState, G extends string, A extends string> = {
  [P in G]: DefaultGetter<S>;
} & {
  [P in A]: DefaultAction<S>;
};

type ReadonlyStateDef = readonly [string];
type WritableStateDef = readonly [string, string];
type StateDef = ReadonlyStateDef | WritableStateDef;

type StateOuterGearResource<S extends AnyState, D extends StateDef> = D extends readonly [
  infer G extends string,
  infer A extends string,
]
  ? WritableOuterGearResource<S, G, A>
  : D extends readonly [infer G extends string]
    ? ReadableOuterGearResource<S, G>
    : never;

interface StatefulOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, PM, S>, _: StatefulOuterGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, PM, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>>;
}

interface StatefulOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, PM, S>, _: StatefulOuterGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearListPlug<RA, KM, DL, PM, S>>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, PM, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulOuterGearListPlug<RA, KM, DL, PM, S>>;
}

// #endregion

// #region Stateless

type InertOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearMapPlugin<RA, KM, DM, PM>, _: InertOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM, PM>>;

type InertOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL, PM>, _: InertOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL, PM>>;

type StatelessOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearMapPlugin<RA, KM, DM, PM>, _: StatelessOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM, PM>>;

type StatelessOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL, PM>, _: StatelessOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL, PM>>;

// #endregion

// #region Runtime

function buildStatefulOuterGearCursor<S extends AnyState>(_state: S): StatefulOuterGearCursor<S> {
  return {
    getter: () => {
      throw new Error("getter: not yet implemented");
    },
    action: () => {
      throw new Error("action: not yet implemented");
    },
    relay: () => {
      throw new Error("relay: not yet implemented");
    },
    cmd: () => {
      throw new Error("cmd: not yet implemented");
    },
  };
}

const statelessOuterGearCursor: StatelessOuterGearCursor = {
  getter: () => {
    throw new Error("getter: not yet implemented");
  },
  relay: () => {
    throw new Error("relay: not yet implemented");
  },
  cmd: () => {
    throw new Error("cmd: not yet implemented");
  },
};

const meta: GearMatrixMeta = { family: "gear", role: "outer" };

const emptyPorts: BaseGearPlugPortMap = {};

function statefulPostProcess<S extends AnyState>(raw: unknown, cursor: StatefulOuterGearCursor<S>): AnyRes {
  if (!Array.isArray(raw)) {
    return raw as AnyRes;
  }

  const [getterName, actionName] = raw;
  const resource: Record<string, unknown> = { [getterName]: cursor.getter() };
  if (actionName !== undefined) {
    resource[actionName] = cursor.action();
  }
  return resource;
}

export function createOuterGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): OuterGearComposer<RA, KM> {
  const withDeps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createOuterGearMapComposer<RA, KM, any>(connector, mask.deps);
    }
    return createOuterGearListComposer<RA, KM, any>(connector, mask.deps);
  }) as OuterGearComposer<RA, KM>["withDeps"];

  const withPorts = createInertOuterGearMapPortsConfigurator<RA, KM, {}>(connector, {} as OuterGearPlugDepMap<RA>);

  const withState = (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearMapDefiner<RA, KM, {}, {}, S>(
      connector,
      {} as HandleMap<RA>,
      emptyPorts,
      defaultState
    ),
  })) as OuterGearComposer<RA, KM>["withState"];

  const define = createStatelessOuterGearMapDefiner<RA, KM, {}, {}>(
    connector,
    {} as OuterGearPlugDepMap<RA>,
    emptyPorts
  ) as unknown as InertOuterGearMapDefiner<RA, KM, {}, {}>;

  return { withDeps, withPorts, withState, define };
}

function createOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): OuterGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    withPorts: () => createOuterGearMapPortsConfigurator<RA, KM, DM>(connector, deps),
    withState: () => createOuterGearMapStateConfigurator<RA, KM, DM, {}>(connector, deps, emptyPorts),
    define: () => createStatelessOuterGearMapDefiner<RA, KM, DM, {}>(connector, deps, emptyPorts),
  });
}

function createOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): OuterGearListComposer<RA, KM, DL> {
  return lazyGetters({
    withPorts: () => createOuterGearListPortsConfigurator<RA, KM, DL>(connector, deps),
    withState: () => createOuterGearListStateConfigurator<RA, KM, DL, {}>(connector, deps, emptyPorts),
    define: () => createStatelessOuterGearListDefiner<RA, KM, DL, {}>(connector, deps, emptyPorts),
  });
}

function createOuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): OuterGearMapPortsConfigurator<RA, KM, DM> {
  return (<const PM extends BaseGearPlugPortMap>(ports: PM) =>
    lazyGetters({
      withState: () => createOuterGearMapStateConfigurator<RA, KM, DM, PM>(connector, deps, ports),
      define: () => createStatelessOuterGearMapDefiner<RA, KM, DM, PM>(connector, deps, ports),
    })) as OuterGearMapPortsConfigurator<RA, KM, DM>;
}

function createOuterGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): OuterGearListPortsConfigurator<RA, KM, DL> {
  return (<const PM extends BaseGearPlugPortMap>(ports: PM) =>
    lazyGetters({
      withState: () => createOuterGearListStateConfigurator<RA, KM, DL, PM>(connector, deps, ports),
      define: () => createStatelessOuterGearListDefiner<RA, KM, DL, PM>(connector, deps, ports),
    })) as OuterGearListPortsConfigurator<RA, KM, DL>;
}

function createInertOuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): InertOuterGearMapPortsConfigurator<RA, KM, DM> {
  return (<const PM extends BaseGearPlugPortMap>(ports: PM) =>
    lazyGetters({
      withState: () => createOuterGearMapStateConfigurator<RA, KM, DM, PM>(connector, deps, ports),
      define: () =>
        createStatelessOuterGearMapDefiner<RA, KM, DM, PM>(
          connector,
          deps,
          ports
        ) as unknown as InertOuterGearMapDefiner<RA, KM, DM, PM>,
    })) as InertOuterGearMapPortsConfigurator<RA, KM, DM>;
}

function createOuterGearMapStateConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DM, ports: PM): OuterGearMapStateConfigurator<RA, KM, DM, PM> {
  return (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearMapDefiner<RA, KM, DM, PM, S>(connector, deps, ports, defaultState),
  })) as OuterGearMapStateConfigurator<RA, KM, DM, PM>;
}

function createOuterGearListStateConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DL, ports: PM): OuterGearListStateConfigurator<RA, KM, DL, PM> {
  return (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearListDefiner<RA, KM, DL, PM, S>(connector, deps, ports, defaultState),
  })) as OuterGearListStateConfigurator<RA, KM, DL, PM>;
}

function createStatefulOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
>(
  connector: ResComposerConnector,
  deps: DM,
  ports: PM,
  defaultState: S
): StatefulOuterGearMapDefiner<RA, KM, DM, PM, S> {
  const head = createStatefulOuterGearMapPlugHead<RA, KM, DM, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>(
    deps,
    ports,
    defaultState
  );

  const cursor = buildStatefulOuterGearCursor(defaultState);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      augmentCtx: ($) => {
        $.state = defaultState;
        $.defaultState = defaultState;
      },
      postProcess: (raw, c) => statefulPostProcess(raw, c as StatefulOuterGearCursor<S>),
    })) as StatefulOuterGearMapDefiner<RA, KM, DM, PM, S>;
}

function createStatefulOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
>(connector: ResComposerConnector, deps: DL, ports: PM, state: S): StatefulOuterGearListDefiner<RA, KM, DL, PM, S> {
  const head = createStatefulOuterGearListPlugHead<RA, KM, DL, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>(
    deps,
    ports,
    state
  );

  const cursor = buildStatefulOuterGearCursor(state);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      augmentCtx: ($) => {
        $.state = state;
        $.defaultState = state;
      },
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulOuterGearCursor<S>),
    })) as StatefulOuterGearListDefiner<RA, KM, DL, PM, S>;
}

function createStatelessOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DM, ports: PM): StatelessOuterGearMapDefiner<RA, KM, DM, PM> {
  const head = createGearMapPlugHead<"outer", RA, KM, DM, PM, GearPluginCtx<RA, KM, PM>>("outer", deps, ports);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor: statelessOuterGearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    });
}

function createStatelessOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(connector: ResComposerConnector, deps: DL, ports: PM): StatelessOuterGearListDefiner<RA, KM, DL, PM> {
  const head = createGearListPlugHead<"outer", RA, KM, DL, PM, GearPluginCtx<RA, KM, PM>>("outer", deps, ports);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor: statelessOuterGearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessOuterGearListDefiner<RA, KM, DL, PM>;
}

// #endregion

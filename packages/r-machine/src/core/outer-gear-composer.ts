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

import type { ActionComposer, AnyAction, DefaultAction } from "./action.js";
import type { BaseGearPlugPortMap } from "./base-gear-plug.js";
import { type CmdComposer, createCmd } from "./cmd.js";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPluginCtx, type GearPlugKitMap } from "./gear-plug.js";
import { createGetter, type DefaultGetter, type GetterComposer, type StatelessGetterComposer } from "./getter.js";
import { promoteMemberNames } from "./member-name.js";
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
import { makeAction } from "./reactivity/action-runtime.js";
import type { CassetteRecorder } from "./reactivity/cassette-recorder.js";
import { createMemoCell } from "./reactivity/memo-cell.js";
import { createStateCell, type StateCell } from "./reactivity/state-cell.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ExtractNamespace } from "./res-domain.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { HandleMap, ValidatedDepMapType } from "./res-map.js";
import type { GearMatrixMeta, ResMatrix } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";
import type { AnyResPlug } from "./res-plug.js";

interface StatelessCloneOverrides<PM> {
  ports?: Partial<PM>;
}

interface StatefulCloneOverrides<PM, S extends AnyState> {
  ports?: Partial<PM>;
  defaultState?: S;
}

export interface StatelessOuterGearResMatrix<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap>
  extends ResMatrix<R, P> {
  clone(): StatelessOuterGearResMatrix<R, P, PM>;
  clone(overrides: StatelessCloneOverrides<PM>): StatelessOuterGearResMatrix<R, P, PM>;
}

export interface StatefulOuterGearResMatrix<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap, S extends AnyState>
  extends ResMatrix<R, P> {
  clone(): StatefulOuterGearResMatrix<R, P, PM, S>;
  clone(overrides: StatefulCloneOverrides<PM, S>): StatefulOuterGearResMatrix<R, P, PM, S>;
}

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
> = <PM extends BaseGearPlugPortMap>(ports: PM) => OuterGearMapPortsComposer<RA, KM, DM, PM>;

type OuterGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => OuterGearListPortsComposer<RA, KM, DL, PM>;

type InertOuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => InertOuterGearMapPortsComposer<RA, KM, DM, PM>;

type InertOuterGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <PM extends BaseGearPlugPortMap>(ports: PM) => InertOuterGearListPortsComposer<RA, KM, DL, PM>;

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
  ): StatefulOuterGearResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>, PM, S>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, PM, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): StatefulOuterGearResMatrix<R, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>, PM, S>;
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
  ): StatefulOuterGearResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearListPlug<RA, KM, DL, PM, S>, PM, S>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, PM, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): StatefulOuterGearResMatrix<R, StatefulOuterGearListPlug<RA, KM, DL, PM, S>, PM, S>;
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
) => StatelessOuterGearResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM, PM>, PM>;

type InertOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL, PM>, _: InertOuterGearCursor) => R | Promise<R>
) => StatelessOuterGearResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL, PM>, PM>;

type StatelessOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearMapPlugin<RA, KM, DM, PM>, _: StatelessOuterGearCursor) => R | Promise<R>
) => StatelessOuterGearResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM, PM>, PM>;

type StatelessOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL, PM>, _: StatelessOuterGearCursor) => R | Promise<R>
) => StatelessOuterGearResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL, PM>, PM>;

// #endregion

// #region Runtime

/** @internal — exposed for testing the resolution wiring */
export const stateCellSlot = Symbol("stateCell");

interface PluginWithStateCell<S> {
  readonly [stateCellSlot]: StateCell<S>;
}

/** @internal — exposed for testing */
export function buildStatelessGetterComposer(recorder: CassetteRecorder): StatelessGetterComposer {
  let counter = 0;
  return ((...args: unknown[]): unknown => {
    counter += 1;
    const name = `getter:${counter}`;
    if (args[0] === "memoized" && typeof args[1] === "function") {
      const memo = createMemoCell(args[1] as () => unknown, recorder);
      return createGetter(() => memo.read(), name);
    }
    if (typeof args[0] === "function") {
      const fn = args[0] as () => unknown;
      return createGetter(() => fn(), name);
    }
    throw new Error("cursor.getter: invalid arguments");
  }) as unknown as StatelessGetterComposer;
}

/** @internal — exposed for testing the resolution wiring */
export function buildStatefulOuterGearCursor<S extends AnyState>(
  cell: StateCell<S>,
  recorder: CassetteRecorder
): StatefulOuterGearCursor<S> {
  let getterCounter = 0;
  const getter = ((...args: unknown[]): unknown => {
    getterCounter += 1;
    const name = `getter:${getterCounter}`;
    if (args.length === 0) {
      return createGetter(() => cell.read(), name);
    }
    if (args[0] === "memoized" && typeof args[1] === "function") {
      const memo = createMemoCell(args[1] as () => unknown, recorder);
      return createGetter(() => memo.read(), name);
    }
    if (typeof args[0] === "function") {
      const fn = args[0] as () => unknown;
      return createGetter(() => fn(), name);
    }
    throw new Error("cursor.getter: invalid arguments");
  }) as unknown as GetterComposer<S>;

  let actionCounter = 0;
  const action = ((reducer?: (...a: unknown[]) => unknown) => {
    actionCounter += 1;
    const r = reducer ?? ((partial: unknown) => partial);
    return makeAction(cell, r as (...a: unknown[]) => unknown, recorder, `action:${actionCounter}`);
  }) as unknown as ActionComposer<S>;

  return {
    getter,
    action,
    relay: () => {
      throw new Error("relay: not yet implemented");
    },
    cmd: ((action: AnyAction, ...payload: unknown[]) => createCmd(action, payload)) as CmdComposer,
  };
}

function buildStatelessOuterGearCursor(recorder: CassetteRecorder): StatelessOuterGearCursor {
  return {
    getter: buildStatelessGetterComposer(recorder),
    relay: () => {
      throw new Error("relay: not yet implemented");
    },
    cmd: ((action: AnyAction, ...payload: unknown[]) => createCmd(action, payload)) as CmdComposer,
  };
}

const meta: GearMatrixMeta = { family: "gear", role: "outer" };

const emptyPorts: BaseGearPlugPortMap = {};

function statefulPostProcess<S extends AnyState>(raw: unknown, _: StatefulOuterGearCursor<S>): AnyRes {
  let resource: AnyRes;
  if (Array.isArray(raw)) {
    const [getterName, actionName] = raw;
    const obj: Record<string, unknown> = { [getterName]: _.getter() };
    if (actionName !== undefined) {
      obj[actionName] = _.action();
    }
    resource = obj as AnyRes;
  } else {
    resource = raw as AnyRes;
  }
  promoteMemberNames(resource);
  return resource;
}

function statelessPostProcess(raw: unknown): AnyRes {
  promoteMemberNames(raw);
  return raw as AnyRes;
}

export function createOuterGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder
): OuterGearComposer<RA, KM> {
  const withDeps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createOuterGearMapComposer<RA, KM, any>(connector, recorder, mask.deps);
    }
    return createOuterGearListComposer<RA, KM, any>(connector, recorder, mask.deps);
  }) as OuterGearComposer<RA, KM>["withDeps"];

  const withPorts = createInertOuterGearMapPortsConfigurator<RA, KM, {}>(
    connector,
    recorder,
    {} as OuterGearPlugDepMap<RA>
  );

  const withState = (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearMapDefiner<RA, KM, {}, {}, S>(
      connector,
      recorder,
      {} as HandleMap<RA>,
      emptyPorts,
      defaultState
    ),
  })) as OuterGearComposer<RA, KM>["withState"];

  const define = createStatelessOuterGearMapDefiner<RA, KM, {}, {}>(
    connector,
    recorder,
    {} as OuterGearPlugDepMap<RA>,
    emptyPorts
  ) as unknown as InertOuterGearMapDefiner<RA, KM, {}, {}>;

  return { withDeps, withPorts, withState, define };
}

function createOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, recorder: CassetteRecorder, deps: DM): OuterGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    withPorts: () => createOuterGearMapPortsConfigurator<RA, KM, DM>(connector, recorder, deps),
    withState: () => createOuterGearMapStateConfigurator<RA, KM, DM, {}>(connector, recorder, deps, emptyPorts),
    define: () => createStatelessOuterGearMapDefiner<RA, KM, DM, {}>(connector, recorder, deps, emptyPorts),
  });
}

function createOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
>(connector: ResComposerConnector, recorder: CassetteRecorder, deps: DL): OuterGearListComposer<RA, KM, DL> {
  return lazyGetters({
    withPorts: () => createOuterGearListPortsConfigurator<RA, KM, DL>(connector, recorder, deps),
    withState: () => createOuterGearListStateConfigurator<RA, KM, DL, {}>(connector, recorder, deps, emptyPorts),
    define: () => createStatelessOuterGearListDefiner<RA, KM, DL, {}>(connector, recorder, deps, emptyPorts),
  });
}

function createOuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, recorder: CassetteRecorder, deps: DM): OuterGearMapPortsConfigurator<RA, KM, DM> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) =>
    lazyGetters({
      withState: () => createOuterGearMapStateConfigurator<RA, KM, DM, PM>(connector, recorder, deps, ports),
      define: () => createStatelessOuterGearMapDefiner<RA, KM, DM, PM>(connector, recorder, deps, ports),
    })) as OuterGearMapPortsConfigurator<RA, KM, DM>;
}

function createOuterGearListPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
>(connector: ResComposerConnector, recorder: CassetteRecorder, deps: DL): OuterGearListPortsConfigurator<RA, KM, DL> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) =>
    lazyGetters({
      withState: () => createOuterGearListStateConfigurator<RA, KM, DL, PM>(connector, recorder, deps, ports),
      define: () => createStatelessOuterGearListDefiner<RA, KM, DL, PM>(connector, recorder, deps, ports),
    })) as OuterGearListPortsConfigurator<RA, KM, DL>;
}

function createInertOuterGearMapPortsConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DM
): InertOuterGearMapPortsConfigurator<RA, KM, DM> {
  return (<PM extends BaseGearPlugPortMap>(ports: PM) =>
    lazyGetters({
      withState: () => createOuterGearMapStateConfigurator<RA, KM, DM, PM>(connector, recorder, deps, ports),
      define: () =>
        createStatelessOuterGearMapDefiner<RA, KM, DM, PM>(
          connector,
          recorder,
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
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DM,
  ports: PM
): OuterGearMapStateConfigurator<RA, KM, DM, PM> {
  return (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearMapDefiner<RA, KM, DM, PM, S>(connector, recorder, deps, ports, defaultState),
  })) as OuterGearMapStateConfigurator<RA, KM, DM, PM>;
}

function createOuterGearListStateConfigurator<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DL,
  ports: PM
): OuterGearListStateConfigurator<RA, KM, DL, PM> {
  return (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearListDefiner<RA, KM, DL, PM, S>(connector, recorder, deps, ports, defaultState),
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
  recorder: CassetteRecorder,
  deps: DM,
  ports: PM,
  defaultState: S
): StatefulOuterGearMapDefiner<RA, KM, DM, PM, S> {
  return ((factory: (plugin: never, cursor: never) => unknown) =>
    buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(
      connector,
      recorder,
      deps,
      ports,
      defaultState,
      factory
    )) as StatefulOuterGearMapDefiner<RA, KM, DM, PM, S>;
}

function buildStatefulOuterGearMapMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DM,
  ports: PM,
  defaultState: S,
  factory: (plugin: never, cursor: never) => unknown
): StatefulOuterGearResMatrix<AnyRes, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>, PM, S> {
  const head = createStatefulOuterGearMapPlugHead<RA, KM, DM, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>(
    deps,
    ports,
    defaultState
  );

  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor: (plugin: unknown) =>
      buildStatefulOuterGearCursor<S>((plugin as { $: PluginWithStateCell<S> }).$[stateCellSlot], recorder),
    userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
    augmentCtx: ($) => {
      const cell = createStateCell(defaultState, recorder);
      ($ as unknown as { [stateCellSlot]: StateCell<S> })[stateCellSlot] = cell;
      Object.defineProperty($, "state", {
        get: () => cell.read(),
        enumerable: true,
      });
      $.defaultState = defaultState;
    },
    postProcess: (raw, c) => statefulPostProcess(raw, c as StatefulOuterGearCursor<S>),
  });

  const clone = (overrides?: StatefulCloneOverrides<PM, S>) => {
    const nextPorts = overrides?.ports !== undefined ? ({ ...ports, ...overrides.ports } as PM) : ports;
    const nextState = overrides?.defaultState !== undefined ? overrides.defaultState : defaultState;
    return buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(connector, recorder, deps, nextPorts, nextState, factory);
  };

  return { ...matrix, clone } as unknown as StatefulOuterGearResMatrix<
    AnyRes,
    StatefulOuterGearMapPlug<RA, KM, DM, PM, S>,
    PM,
    S
  >;
}

function createStatefulOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DL,
  ports: PM,
  state: S
): StatefulOuterGearListDefiner<RA, KM, DL, PM, S> {
  return ((factory: (plugin: never, cursor: never) => unknown) =>
    buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
      connector,
      recorder,
      deps,
      ports,
      state,
      factory
    )) as StatefulOuterGearListDefiner<RA, KM, DL, PM, S>;
}

function buildStatefulOuterGearListMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DL,
  ports: PM,
  defaultState: S,
  factory: (plugin: never, cursor: never) => unknown
): StatefulOuterGearResMatrix<AnyRes, StatefulOuterGearListPlug<RA, KM, DL, PM, S>, PM, S> {
  const head = createStatefulOuterGearListPlugHead<RA, KM, DL, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>(
    deps,
    ports,
    defaultState
  );

  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor: (plugin: unknown) => {
      const arr = plugin as ReadonlyArray<unknown>;
      const ctx = arr[arr.length - 1] as PluginWithStateCell<S>;
      return buildStatefulOuterGearCursor<S>(ctx[stateCellSlot], recorder);
    },
    userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
    augmentCtx: ($) => {
      const cell = createStateCell(defaultState, recorder);
      ($ as unknown as { [stateCellSlot]: StateCell<S> })[stateCellSlot] = cell;
      Object.defineProperty($, "state", {
        get: () => cell.read(),
        enumerable: true,
      });
      $.defaultState = defaultState;
    },
    postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulOuterGearCursor<S>),
  });

  const clone = (overrides?: StatefulCloneOverrides<PM, S>) => {
    const nextPorts = overrides?.ports !== undefined ? ({ ...ports, ...overrides.ports } as PM) : ports;
    const nextState = overrides?.defaultState !== undefined ? overrides.defaultState : defaultState;
    return buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
      connector,
      recorder,
      deps,
      nextPorts,
      nextState,
      factory
    );
  };

  return { ...matrix, clone } as unknown as StatefulOuterGearResMatrix<
    AnyRes,
    StatefulOuterGearListPlug<RA, KM, DL, PM, S>,
    PM,
    S
  >;
}

function createStatelessOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DM,
  ports: PM
): StatelessOuterGearMapDefiner<RA, KM, DM, PM> {
  const head = createGearMapPlugHead<"outer", RA, KM, DM, PM, GearPluginCtx<RA, KM, PM>>("outer", deps, ports);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor: buildStatelessOuterGearCursor(recorder),
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
      postProcess: (raw) => statelessPostProcess(raw),
    });
}

function createStatelessOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DL,
  ports: PM
): StatelessOuterGearListDefiner<RA, KM, DL, PM> {
  const head = createGearListPlugHead<"outer", RA, KM, DL, PM, GearPluginCtx<RA, KM, PM>>("outer", deps, ports);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor: buildStatelessOuterGearCursor(recorder),
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
      postProcess: (raw) => statelessPostProcess(raw),
    })) as StatelessOuterGearListDefiner<RA, KM, DL, PM>;
}

// #endregion

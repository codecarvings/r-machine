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

import { ERR_INVALID_ARGUMENTS, RMachineUsageError } from "#r-machine/errors";
import type { ActionComposer, AnyAction, DefaultAction } from "./action.js";
import { makeAction } from "./action-runtime.js";
import type { BaseGearPlugPortMap } from "./base-gear-plug.js";
import type { CassetteRecorder } from "./cassette-recorder.js";
import { type CmdComposer, createCmd } from "./cmd.js";
import { lazyGetters } from "./composer-utils.js";
import { type DeepPartial, deepPartialMerge } from "./deep-partial.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPluginCtx, type GearPlugKitMap } from "./gear-plug.js";
import {
  createGetter,
  type DefaultGetter,
  type GetterCellComposer,
  type GetterComposer,
  type StatelessGetterComposer,
} from "./getter.js";
import { createGetterCell } from "./getter-cell.js";
import { promoteMemberNames } from "./member-name.js";
import type { AnyOuterGear, RejectAsyncValueProps } from "./outer-gear.js";
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
import { type ExtractPlugin, getPlugOutline } from "./plug.js";
import { type AnyRelay, createRelay, createRelayRuntime, type RelayComposer } from "./relay.js";
import { type AnyRes, tryGetDispose } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { AnyNamespace, ExtractNamespace } from "./res-domain.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { HandleMap, ValidatedDepMapType } from "./res-map.js";
import type { GearMatrixMeta, NoExcess, ResMatrix } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";
import type { AnyResPlug } from "./res-plug.js";
import type { AnyState } from "./state.js";
import { setStateAccess, tryGetStateAccess } from "./state.js";
import { createStateCell, type StateCell } from "./state-cell.js";
import { isThenable } from "./sync-resolve.js";

// T is the actual return type, instantiated at each call site. Threaded as a
// regular parameter (with default `R` for runtime/storage use) so an
// anonymous fn passed to `clone(fn)` doesn't have to satisfy every subtype
// of R — the matrix's clone METHOD declares the generic, TS infers T from
// the literal at the call site, and NoExcess catches stray properties.
type StatelessCloneFn<R, P extends AnyResPlug, T extends R = R> = (
  res: R,
  plugin: ExtractPlugin<P>,
  cursor: StatelessOuterGearCursor
) => NoExcess<R, T> | Promise<NoExcess<R, T>>;

type StatefulCloneFn<R, P extends AnyResPlug, S extends AnyState, T extends R = R> = (
  res: R,
  plugin: ExtractPlugin<P>,
  cursor: StatefulOuterGearCursor<S>
) => NoExcess<R, T> | Promise<NoExcess<R, T>>;

type StatelessOuterGearWithPortsCapability<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
> = keyof PM extends never
  ? unknown
  : {
      readonly withPorts: (ports: Partial<PM>) => StatelessOuterGearMatrixPortsBuilder<R, P, PM>;
    };

interface StatelessOuterGearClone<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> {
  (): StatelessOuterGearResMatrix<R, P, PM>;
  <T extends R>(fn: StatelessCloneFn<R, P, T>): StatelessOuterGearResMatrix<R, P, PM>;
}

interface StatelessOuterGearMatrixPortsBuilder<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> {
  readonly clone: StatelessOuterGearClone<R, P, PM>;
}

type StatelessOuterGearResMatrix<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap> = ResMatrix<R, P> & {
  readonly clone: StatelessOuterGearClone<R, P, PM>;
} & StatelessOuterGearWithPortsCapability<R, P, PM>;

type StatefulOuterGearWithPortsCapability<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = keyof PM extends never
  ? unknown
  : {
      readonly withPorts: (ports: Partial<PM>) => StatefulOuterGearMatrixPortsBuilder<R, P, PM, S>;
    };

interface StatefulOuterGearMatrixClone<R, P extends AnyResPlug, PM extends BaseGearPlugPortMap, S extends AnyState> {
  (): StatefulOuterGearResMatrix<R, P, PM, S>;
  <T extends R>(fn: StatefulCloneFn<R, P, S, T>): StatefulOuterGearResMatrix<R, P, PM, S>;
}

interface StatefulOuterGearMatrixPortsBuilder<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  readonly withState: (state: DeepPartial<S>) => StatefulOuterGearMatrixPortsStateBuilder<R, P, PM, S>;
  readonly clone: StatefulOuterGearMatrixClone<R, P, PM, S>;
}

interface StatefulOuterGearMatrixStateBuilder<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  readonly clone: StatefulOuterGearMatrixClone<R, P, PM, S>;
}

type StatefulOuterGearStateBuilderWithPorts<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = keyof PM extends never
  ? unknown
  : {
      readonly withPorts: (ports: Partial<PM>) => StatefulOuterGearMatrixPortsStateBuilder<R, P, PM, S>;
    };

type StatefulOuterGearMatrixStateThenPortsBuilder<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = StatefulOuterGearMatrixStateBuilder<R, P, PM, S> & StatefulOuterGearStateBuilderWithPorts<R, P, PM, S>;

interface StatefulOuterGearMatrixPortsStateBuilder<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> {
  readonly clone: StatefulOuterGearMatrixClone<R, P, PM, S>;
}

type StatefulOuterGearResMatrix<
  R,
  P extends AnyResPlug,
  PM extends BaseGearPlugPortMap,
  S extends AnyState,
> = ResMatrix<R, P> & {
  readonly clone: StatefulOuterGearMatrixClone<R, P, PM, S>;
  readonly withState: (state: DeepPartial<S>) => StatefulOuterGearMatrixStateThenPortsBuilder<R, P, PM, S>;
} & StatefulOuterGearWithPortsCapability<R, P, PM, S>;

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

export const stateCellSlot = Symbol("stateCell");

/** opaque slot used by the cursor to hand its relay-cleanup list to the postProcess. */
const relayCleanupSlot: unique symbol = Symbol("relayCleanup");

function attachRelayCleanup<C extends object>(cursor: C, disposes: Array<() => void>): C {
  Object.defineProperty(cursor, relayCleanupSlot, { value: disposes, enumerable: false });
  return cursor;
}

function takeRelayCleanup(cursor: unknown): Array<() => void> | undefined {
  return (cursor as { [relayCleanupSlot]?: Array<() => void> })[relayCleanupSlot];
}

interface PluginWithStateCell<S> {
  readonly [stateCellSlot]: StateCell<S>;
}

export function buildStatelessGetterComposer(): StatelessGetterComposer {
  let counter = 0;
  return ((...args: unknown[]): unknown => {
    counter += 1;
    const name = `getter:${counter}`;
    if (typeof args[0] === "function") {
      const fn = args[0] as () => unknown;
      return createGetter(() => fn(), name);
    }
    throw new RMachineUsageError(ERR_INVALID_ARGUMENTS, "cursor.getter: invalid arguments.");
  }) as unknown as StatelessGetterComposer;
}

/**
 * Builds the `cell` composer (short for "getterCell"): a getter backed by its
 * own cell in the reactive graph. The cell memoizes its body and is its own
 * dependency, so it returns a `Getter<V>` — hence read-only.
 */
export function buildGetterCellComposer(recorder: CassetteRecorder): GetterCellComposer {
  let counter = 0;
  return ((body: () => unknown): unknown => {
    counter += 1;
    const cell = createGetterCell(body, recorder);
    return createGetter(() => cell.read(), `cell:${counter}`);
  }) as GetterCellComposer;
}

export function buildStatefulOuterGearCursor<S extends AnyState>(
  cell: StateCell<S>,
  recorder: CassetteRecorder,
  namespace?: AnyNamespace
): StatefulOuterGearCursor<S> {
  let getterCounter = 0;
  const getter = ((...args: unknown[]): unknown => {
    getterCounter += 1;
    const name = `getter:${getterCounter}`;
    if (args.length === 0) {
      return createGetter(() => cell.read(), name);
    }
    if (typeof args[0] === "function") {
      const fn = args[0] as () => unknown;
      return createGetter(() => fn(), name);
    }
    throw new RMachineUsageError(ERR_INVALID_ARGUMENTS, "cursor.getter: invalid arguments.");
  }) as unknown as GetterComposer<S>;

  const getterCellComposer = buildGetterCellComposer(recorder);

  let actionCounter = 0;
  const action = ((reducer?: (...a: unknown[]) => unknown) => {
    actionCounter += 1;
    const r = reducer ?? ((partial: unknown) => partial);
    return makeAction(cell, r as (...a: unknown[]) => unknown, recorder, `action:${actionCounter}`, namespace);
  }) as unknown as ActionComposer<S>;

  const relayDisposes: Array<() => void> = [];
  let relayCounter = 0;
  const relay = ((config: unknown) => {
    relayCounter += 1;
    const branded = createRelay(config as never, `relay:${relayCounter}`);
    const rt = createRelayRuntime(branded as AnyRelay, recorder, namespace);
    relayDisposes.push(() => rt.dispose());
    return branded;
  }) as unknown as RelayComposer;

  return attachRelayCleanup(
    {
      getter,
      cell: getterCellComposer,
      action,
      relay,
      cmd: ((action: AnyAction, ...payload: unknown[]) => createCmd(action, payload)) as CmdComposer,
    },
    relayDisposes
  );
}

function buildStatelessOuterGearCursor(recorder: CassetteRecorder, namespace?: AnyNamespace): StatelessOuterGearCursor {
  const relayDisposes: Array<() => void> = [];
  let relayCounter = 0;
  const relay = ((config: unknown) => {
    relayCounter += 1;
    const branded = createRelay(config as never, `relay:${relayCounter}`);
    const rt = createRelayRuntime(branded as AnyRelay, recorder, namespace);
    relayDisposes.push(() => rt.dispose());
    return branded;
  }) as unknown as RelayComposer;

  return attachRelayCleanup(
    {
      getter: buildStatelessGetterComposer(),
      cell: buildGetterCellComposer(recorder),
      relay,
      cmd: ((action: AnyAction, ...payload: unknown[]) => createCmd(action, payload)) as CmdComposer,
    },
    relayDisposes
  );
}

const meta: GearMatrixMeta = { family: "gear", role: "outer" };

const emptyPorts: BaseGearPlugPortMap = {};

export function wrapWithRelayCleanup(resource: AnyRes, cursor: unknown): AnyRes {
  const relayDisposes = takeRelayCleanup(cursor) ?? [];
  const userDispose = tryGetDispose(resource);
  if (relayDisposes.length === 0 && !userDispose) {
    return resource;
  }
  let disposed = false;
  const combined = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    if (userDispose) {
      try {
        userDispose();
      } catch (e) {
        console.error(e);
      }
    }
    for (const d of relayDisposes) {
      try {
        d();
      } catch (e) {
        console.error(e);
      }
    }
  };
  (resource as { [Symbol.dispose]: () => void })[Symbol.dispose] = combined;
  return resource;
}

function statelessPostProcess(raw: unknown, cursor: unknown): AnyRes {
  promoteMemberNames(raw);
  return wrapWithRelayCleanup(raw as AnyRes, cursor);
}

// Run the user factory chain (user `.define` body → optional state conversion →
// optional clone-composed fn) returning SYNCHRONOUSLY when every step is sync,
// and a Promise only when something genuinely awaits. A sync result makes the
// matrix Tier-B sync-eligible (see res-matrix `createSync` /
// `isResMatrixSyncEligible`), so a synchronous gear can be re-created in render
// phase without Suspense; an async body keeps the gear on the async path.
function runOuterFactory(
  rawUserFactory: (plugin: unknown, cursor: unknown) => unknown,
  plugin: unknown,
  cursor: unknown,
  convert: ((raw: unknown, cursor: unknown) => unknown) | undefined,
  composedFn: ((res: never, plugin: never, cursor: never) => unknown) | undefined
): unknown | Promise<unknown> {
  const rawOrPromise = rawUserFactory(plugin, cursor);
  if (isThenable(rawOrPromise)) {
    return (async () => {
      const raw = await rawOrPromise;
      const converted = convert ? convert(raw, cursor) : raw;
      return composedFn ? await composedFn(converted as never, plugin as never, cursor as never) : converted;
    })();
  }
  const converted = convert ? convert(rawOrPromise, cursor) : rawOrPromise;
  if (composedFn === undefined) {
    return converted;
  }
  // composedFn may itself be sync or async — return its value verbatim so a
  // sync chain stays sync (and an async clone fn falls back to the async path).
  return composedFn(converted as never, plugin as never, cursor as never);
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
  rawUserFactory: (plugin: never, cursor: never) => unknown,
  composedFn?: StatefulCloneFn<AnyRes, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>, S>
): StatefulOuterGearResMatrix<AnyRes, StatefulOuterGearMapPlug<RA, KM, DM, PM, S>, PM, S> {
  type ThisPlug = StatefulOuterGearMapPlug<RA, KM, DM, PM, S>;
  const head = createStatefulOuterGearMapPlugHead<RA, KM, DM, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>(
    deps,
    ports,
    defaultState
  );

  // Convert array→object BEFORE the user's clone fn sees it, so fn operates
  // on the same R the matrix advertises at the type level (StateDef factories
  // return arrays at runtime but their R is the derived object shape).
  const effectiveFactory = (plugin: unknown, cursor: unknown): unknown | Promise<unknown> =>
    runOuterFactory(
      rawUserFactory as (plugin: unknown, cursor: unknown) => unknown,
      plugin,
      cursor,
      (raw, c) => convertStatefulRaw(raw, c as StatefulOuterGearCursor<S>),
      composedFn as ((res: never, plugin: never, cursor: never) => unknown) | undefined
    );

  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor: (plugin: unknown, selfNs?: AnyNamespace) => {
      const cell = (plugin as { $: PluginWithStateCell<S> }).$[stateCellSlot];
      const cursor = buildStatefulOuterGearCursor<S>(cell, recorder, selfNs);
      // Stash the live state cell on the cursor so `postProcess` can stamp it
      // onto `res` (the testing layer reaches it via the surface). See state.ts.
      setStateAccess(cursor, cell);
      return cursor;
    },
    userFactory: effectiveFactory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
    augmentCtx: ($) => {
      const cell = createStateCell(defaultState, recorder);
      ($ as unknown as { [stateCellSlot]: StateCell<S> })[stateCellSlot] = cell;
      // Also expose the cell on `$` so the resource's own resolve output
      // (`{ ...deps, $ }`) carries it — the `mockPlug` controller's own-state.
      setStateAccess($, cell);
      Object.defineProperty($, "state", {
        get: () => cell.read(),
        enumerable: true,
      });
      $.defaultState = defaultState;
    },
    postProcess: (raw, c) => {
      const res = statefulPostProcessAfterConversion(raw, c as StatefulOuterGearCursor<S>);
      const cell = tryGetStateAccess(c as object);
      if (cell !== undefined) {
        setStateAccess(res, cell);
      }
      return res;
    },
  });

  const clone = (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
    buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(
      connector,
      recorder,
      deps,
      ports,
      defaultState,
      rawUserFactory,
      composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
    );

  const withPorts = (overridePorts: Partial<PM>) => ({
    withState: (overrideState: DeepPartial<S>) => ({
      clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
        buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(
          connector,
          recorder,
          deps,
          { ...ports, ...overridePorts } as PM,
          deepPartialMerge(defaultState, overrideState),
          rawUserFactory,
          composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
        ),
    }),
    clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
      buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(
        connector,
        recorder,
        deps,
        { ...ports, ...overridePorts } as PM,
        defaultState,
        rawUserFactory,
        composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
      ),
  });

  const withState = (overrideState: DeepPartial<S>) => ({
    withPorts: (overridePorts: Partial<PM>) => ({
      clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
        buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(
          connector,
          recorder,
          deps,
          { ...ports, ...overridePorts } as PM,
          deepPartialMerge(defaultState, overrideState),
          rawUserFactory,
          composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
        ),
    }),
    clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
      buildStatefulOuterGearMapMatrix<RA, KM, DM, PM, S>(
        connector,
        recorder,
        deps,
        ports,
        deepPartialMerge(defaultState, overrideState),
        rawUserFactory,
        composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
      ),
  });

  return { ...matrix, clone, withPorts, withState } as unknown as StatefulOuterGearResMatrix<AnyRes, ThisPlug, PM, S>;
}

function convertStatefulRaw<S extends AnyState>(raw: unknown, cursor: StatefulOuterGearCursor<S>): AnyRes {
  if (Array.isArray(raw)) {
    const [getterName, actionName] = raw;
    const obj: Record<string, unknown> = { [getterName]: cursor.getter() };
    if (actionName !== undefined) {
      obj[actionName] = cursor.action();
    }
    return obj as AnyRes;
  }
  return raw as AnyRes;
}

function statefulPostProcessAfterConversion<S extends AnyState>(
  raw: unknown,
  cursor: StatefulOuterGearCursor<S>
): AnyRes {
  // raw is already an object — conversion happened in effectiveFactory so
  // any user-provided clone fn sees the matrix's R shape.
  promoteMemberNames(raw as AnyRes);
  return wrapWithRelayCleanup(raw as AnyRes, cursor);
}

function composeStatefulFn<R, P extends AnyResPlug, S extends AnyState>(
  prev: StatefulCloneFn<R, P, S> | undefined,
  next: StatefulCloneFn<R, P, S> | undefined
): StatefulCloneFn<R, P, S> | undefined {
  if (prev === undefined) {
    return next;
  }
  if (next === undefined) {
    return prev;
  }
  return async (res, plugin, cursor) => next(await prev(res, plugin, cursor), plugin, cursor);
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
  rawUserFactory: (plugin: never, cursor: never) => unknown,
  composedFn?: StatefulCloneFn<AnyRes, StatefulOuterGearListPlug<RA, KM, DL, PM, S>, S>
): StatefulOuterGearResMatrix<AnyRes, StatefulOuterGearListPlug<RA, KM, DL, PM, S>, PM, S> {
  type ThisPlug = StatefulOuterGearListPlug<RA, KM, DL, PM, S>;
  const head = createStatefulOuterGearListPlugHead<RA, KM, DL, PM, StatefulOuterGearPluginCtx<RA, KM, PM, S>, S>(
    deps,
    ports,
    defaultState
  );

  const effectiveFactory = (plugin: unknown, cursor: unknown): unknown | Promise<unknown> =>
    runOuterFactory(
      rawUserFactory as (plugin: unknown, cursor: unknown) => unknown,
      plugin,
      cursor,
      (raw, c) => convertStatefulRaw(raw, c as StatefulOuterGearCursor<S>),
      composedFn as ((res: never, plugin: never, cursor: never) => unknown) | undefined
    );

  const matrix = createResMatrix({
    connector,
    meta,
    head,
    cursor: (plugin: unknown, selfNs?: AnyNamespace) => {
      const arr = plugin as ReadonlyArray<unknown>;
      const ctx = arr[arr.length - 1] as PluginWithStateCell<S>;
      const cell = ctx[stateCellSlot];
      const cursor = buildStatefulOuterGearCursor<S>(cell, recorder, selfNs);
      setStateAccess(cursor, cell);
      return cursor;
    },
    userFactory: effectiveFactory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
    augmentCtx: ($) => {
      const cell = createStateCell(defaultState, recorder);
      ($ as unknown as { [stateCellSlot]: StateCell<S> })[stateCellSlot] = cell;
      setStateAccess($, cell);
      Object.defineProperty($, "state", {
        get: () => cell.read(),
        enumerable: true,
      });
      $.defaultState = defaultState;
    },
    postProcess: (raw, c) => {
      const res = statefulPostProcessAfterConversion(raw, c as unknown as StatefulOuterGearCursor<S>);
      const cell = tryGetStateAccess(c as object);
      if (cell !== undefined) {
        setStateAccess(res, cell);
      }
      return res;
    },
  });

  const clone = (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
    buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
      connector,
      recorder,
      deps,
      ports,
      defaultState,
      rawUserFactory,
      composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
    );

  const withPorts = (overridePorts: Partial<PM>) => ({
    withState: (overrideState: DeepPartial<S>) => ({
      clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
        buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
          connector,
          recorder,
          deps,
          { ...ports, ...overridePorts } as PM,
          deepPartialMerge(defaultState, overrideState),
          rawUserFactory,
          composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
        ),
    }),
    clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
      buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
        connector,
        recorder,
        deps,
        { ...ports, ...overridePorts } as PM,
        defaultState,
        rawUserFactory,
        composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
      ),
  });

  const withState = (overrideState: DeepPartial<S>) => ({
    withPorts: (overridePorts: Partial<PM>) => ({
      clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
        buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
          connector,
          recorder,
          deps,
          { ...ports, ...overridePorts } as PM,
          deepPartialMerge(defaultState, overrideState),
          rawUserFactory,
          composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
        ),
    }),
    clone: (fn?: StatefulCloneFn<AnyRes, ThisPlug, S>) =>
      buildStatefulOuterGearListMatrix<RA, KM, DL, PM, S>(
        connector,
        recorder,
        deps,
        ports,
        deepPartialMerge(defaultState, overrideState),
        rawUserFactory,
        composeStatefulFn<AnyRes, ThisPlug, S>(composedFn, fn)
      ),
  });

  return { ...matrix, clone, withPorts, withState } as unknown as StatefulOuterGearResMatrix<AnyRes, ThisPlug, PM, S>;
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
  return ((factory: (plugin: never, cursor: never) => unknown) =>
    buildStatelessOuterGearMapMatrix<RA, KM, DM, PM>(
      connector,
      recorder,
      deps,
      ports,
      factory
    )) as StatelessOuterGearMapDefiner<RA, KM, DM, PM>;
}

function buildStatelessOuterGearMapMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DM,
  ports: PM,
  rawUserFactory: (plugin: never, cursor: never) => unknown,
  composedFn?: StatelessCloneFn<AnyRes, StatelessOuterGearMapPlug<RA, KM, DM, PM>>
): StatelessOuterGearResMatrix<AnyRes, StatelessOuterGearMapPlug<RA, KM, DM, PM>, PM> {
  type ThisPlug = StatelessOuterGearMapPlug<RA, KM, DM, PM>;
  const head = createGearMapPlugHead<"outer", RA, KM, DM, PM, GearPluginCtx<RA, KM, PM>>("outer", deps, ports);

  const effectiveFactory = (plugin: unknown, cursor: unknown): unknown | Promise<unknown> =>
    runOuterFactory(
      rawUserFactory as (plugin: unknown, cursor: unknown) => unknown,
      plugin,
      cursor,
      undefined,
      composedFn as ((res: never, plugin: never, cursor: never) => unknown) | undefined
    );

  const matrix = createResMatrix({
    connector: connector,
    meta,
    head,
    // Per-resolve factory so each instance has its own relay-cleanup
    // closure; the cursor object is shared as the `cursor` arg to both
    // the user factory and the postProcess for relay teardown wiring.
    cursor: (_plugin: unknown, selfNs?: AnyNamespace) => buildStatelessOuterGearCursor(recorder, selfNs),
    userFactory: effectiveFactory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    postProcess: (raw, c) => statelessPostProcess(raw, c as unknown),
  });

  const clone = (fn?: StatelessCloneFn<AnyRes, ThisPlug>) =>
    buildStatelessOuterGearMapMatrix<RA, KM, DM, PM>(
      connector,
      recorder,
      deps,
      ports,
      rawUserFactory,
      composeStatelessFn<AnyRes, ThisPlug>(composedFn, fn)
    );

  const withPorts = (overridePorts: Partial<PM>) => ({
    clone: (fn?: StatelessCloneFn<AnyRes, ThisPlug>) =>
      buildStatelessOuterGearMapMatrix<RA, KM, DM, PM>(
        connector,
        recorder,
        deps,
        { ...ports, ...overridePorts } as PM,
        rawUserFactory,
        composeStatelessFn<AnyRes, ThisPlug>(composedFn, fn)
      ),
  });

  return { ...matrix, clone, withPorts } as unknown as StatelessOuterGearResMatrix<AnyRes, ThisPlug, PM>;
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
  return ((factory: (plugin: never, cursor: never) => unknown) =>
    buildStatelessOuterGearListMatrix<RA, KM, DL, PM>(
      connector,
      recorder,
      deps,
      ports,
      factory
    )) as StatelessOuterGearListDefiner<RA, KM, DL, PM>;
}

function buildStatelessOuterGearListMatrix<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  PM extends BaseGearPlugPortMap,
>(
  connector: ResComposerConnector,
  recorder: CassetteRecorder,
  deps: DL,
  ports: PM,
  rawUserFactory: (plugin: never, cursor: never) => unknown,
  composedFn?: StatelessCloneFn<AnyRes, StatelessOuterGearListPlug<RA, KM, DL, PM>>
): StatelessOuterGearResMatrix<AnyRes, StatelessOuterGearListPlug<RA, KM, DL, PM>, PM> {
  type ThisPlug = StatelessOuterGearListPlug<RA, KM, DL, PM>;
  const head = createGearListPlugHead<"outer", RA, KM, DL, PM, GearPluginCtx<RA, KM, PM>>("outer", deps, ports);

  const effectiveFactory = (plugin: unknown, cursor: unknown): unknown | Promise<unknown> =>
    runOuterFactory(
      rawUserFactory as (plugin: unknown, cursor: unknown) => unknown,
      plugin,
      cursor,
      undefined,
      composedFn as ((res: never, plugin: never, cursor: never) => unknown) | undefined
    );

  const matrix = createResMatrix({
    connector: connector,
    meta,
    head,
    cursor: (_plugin: unknown, selfNs?: AnyNamespace) => buildStatelessOuterGearCursor(recorder, selfNs),
    userFactory: effectiveFactory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    postProcess: (raw, c) => statelessPostProcess(raw, c as unknown),
  });

  const clone = (fn?: StatelessCloneFn<AnyRes, ThisPlug>) =>
    buildStatelessOuterGearListMatrix<RA, KM, DL, PM>(
      connector,
      recorder,
      deps,
      ports,
      rawUserFactory,
      composeStatelessFn<AnyRes, ThisPlug>(composedFn, fn)
    );

  const withPorts = (overridePorts: Partial<PM>) => ({
    clone: (fn?: StatelessCloneFn<AnyRes, ThisPlug>) =>
      buildStatelessOuterGearListMatrix<RA, KM, DL, PM>(
        connector,
        recorder,
        deps,
        { ...ports, ...overridePorts } as PM,
        rawUserFactory,
        composeStatelessFn<AnyRes, ThisPlug>(composedFn, fn)
      ),
  });

  return { ...matrix, clone, withPorts } as unknown as StatelessOuterGearResMatrix<AnyRes, ThisPlug, PM>;
}

function composeStatelessFn<R, P extends AnyResPlug>(
  prev: StatelessCloneFn<R, P> | undefined,
  next: StatelessCloneFn<R, P> | undefined
): StatelessCloneFn<R, P> | undefined {
  if (prev === undefined) {
    return next;
  }
  if (next === undefined) {
    return prev;
  }
  return async (res, plugin, cursor) => next(await prev(res, plugin, cursor), plugin, cursor);
}

// #endregion

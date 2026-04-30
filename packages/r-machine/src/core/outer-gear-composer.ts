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
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPlugKitMap } from "./gear-plug.js";
import type { DefaultGetter } from "./getter.js";
import type { AnyOuterGear, AnyState, RejectAsyncValueProps } from "./outer-gear.js";
import {
  createStatefulOuterGearListPlugHead,
  createStatefulOuterGearMapPlugHead,
  type InertOuterGearCursor,
  type OuterGearPlugDepList,
  type OuterGearPlugDepMap,
  type StatefulOuterGearCtx,
  type StatefulOuterGearCursor,
  type StatefulOuterGearListPlug,
  type StatefulOuterGearListPlugin,
  type StatefulOuterGearMapPlug,
  type StatefulOuterGearMapPlugin,
  type StatelessOuterGearCursor,
  type StatelessOuterGearListPlug,
  type StatelessOuterGearListPlugin,
  type StatelessOuterGearMapPlug,
  type StatelessOuterGearMapPlugin,
} from "./outer-gear-plug.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { ExtractNamespace } from "./res-domain.js";
import type { ValidatedDepListType } from "./res-list.js";
import type { AnyResolvedNamespaceMap, HandleMap, ValidatedDepMapType } from "./res-map.js";
import type { GearMatrixMeta, ResMatrix } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";

export interface OuterGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withState: OuterGearMapStateComposer<RA, KM, {}>;
  readonly deps: OuterGearDepsComposer<RA, KM>;
  readonly define: InertOuterGearMapDefiner<RA, KM, {}>;
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
  readonly withState: OuterGearMapStateComposer<RA, KM, DM>;
  readonly define: StatelessOuterGearMapDefiner<RA, KM, DM>;
}

interface OuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> {
  readonly withState: OuterGearListStateComposer<RA, KM, DL>;
  readonly define: StatelessOuterGearListDefiner<RA, KM, DL>;
}

interface InertOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> {
  readonly withState: OuterGearMapStateComposer<RA, KM, DM>;
  readonly define: InertOuterGearMapDefiner<RA, KM, DM>;
}

interface InertOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> {
  readonly withState: OuterGearListStateComposer<RA, KM, DL>;
  readonly define: InertOuterGearListDefiner<RA, KM, DL>;
}

type OuterGearMapStateComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = <S extends AnyState>(defaultState: S) => StatefulOuterGearMapComposer<RA, KM, DM, S>;

type OuterGearListStateComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <S extends AnyState>(defaultState: S) => StatefulOuterGearListComposer<RA, KM, DL, S>;

// #region Stateful

interface StatefulOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  S extends AnyState,
> {
  readonly define: StatefulOuterGearMapDefiner<RA, KM, DM, S>;
}

interface StatefulOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  S extends AnyState,
> {
  readonly define: StatefulOuterGearListDefiner<RA, KM, DL, S>;
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
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, S>, _: StatefulOuterGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearMapPlug<RA, KM, DM, S>>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearMapPlugin<RA, KM, DM, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulOuterGearMapPlug<RA, KM, DM, S>>;
}

interface StatefulOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  S extends AnyState,
> {
  <const D extends StateDef>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, S>, _: StatefulOuterGearCursor<S>) => D | Promise<D>
  ): ResMatrix<StateOuterGearResource<S, D>, StatefulOuterGearListPlug<RA, KM, DL, S>>;

  <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
    factory: (plugin: StatefulOuterGearListPlugin<RA, KM, DL, S>, _: StatefulOuterGearCursor<S>) => R | Promise<R>
  ): ResMatrix<R, StatefulOuterGearListPlug<RA, KM, DL, S>>;
}

// #endregion

// #region Stateless

type InertOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearMapPlugin<RA, KM, DM>, _: InertOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM>>;

type InertOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL>, _: InertOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL>>;

type StatelessOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearMapPlugin<RA, KM, DM>, _: StatelessOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearMapPlug<RA, KM, DM>>;

type StatelessOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
> = <R extends AnyOuterGear & RejectAsyncValueProps<R>>(
  factory: (plugin: StatelessOuterGearListPlugin<RA, KM, DL>, _: StatelessOuterGearCursor) => R | Promise<R>
) => ResMatrix<R, StatelessOuterGearListPlug<RA, KM, DL>>;

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

function statefulPostProcess<S extends AnyState>(raw: unknown, cursor: StatefulOuterGearCursor<S>): AnyRes {
  if (!Array.isArray(raw)) {
    return raw as AnyRes;
  }

  const [getterName, actionName] = raw;
  const resource: AnyResolvedNamespaceMap = { [getterName]: cursor.getter() };
  if (actionName !== undefined) {
    resource[actionName] = cursor.action();
  }
  return resource;
}

export function createOuterGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>>(
  connector: ResComposerConnector
): OuterGearComposer<RA, KM> {
  const withState = (<S extends AnyState>(defaultState: S) => ({
    define: createStatefulOuterGearMapDefiner<RA, KM, {}, S>(connector, {} as HandleMap<RA>, defaultState),
  })) as OuterGearComposer<RA, KM>["withState"];

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createOuterGearMapComposer<RA, KM, any>(connector, mask.deps);
    }
    return createOuterGearListComposer<RA, KM, any>(connector, mask.deps);
  }) as OuterGearComposer<RA, KM>["deps"];

  const define = createStatelessOuterGearMapDefiner<RA, KM, {}>(
    connector,
    {} as OuterGearPlugDepMap<RA>
  ) as unknown as InertOuterGearMapDefiner<RA, KM, {}>;

  return { withState, deps, define };
}

function createOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): OuterGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    withState: () =>
      (<S extends AnyState>(defaultState: S) => ({
        define: createStatefulOuterGearMapDefiner<RA, KM, DM, S>(connector, deps, defaultState),
      })) as OuterGearMapComposer<RA, KM, DM>["withState"],
    define: () => createStatelessOuterGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
>(connector: ResComposerConnector, deps: DL): OuterGearListComposer<RA, KM, DL> {
  return lazyGetters({
    withState: () =>
      (<S extends AnyState>(defaultState: S) => ({
        define: createStatefulOuterGearListDefiner<RA, KM, DL, S>(connector, deps, defaultState),
      })) as OuterGearListComposer<RA, KM, DL>["withState"],
    define: () => createStatelessOuterGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createStatefulOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
  S extends AnyState,
>(connector: ResComposerConnector, deps: DM, defaultState: S): StatefulOuterGearMapDefiner<RA, KM, DM, S> {
  const head = createStatefulOuterGearMapPlugHead<RA, KM, DM, StatefulOuterGearCtx<RA, KM, S>, S>(deps, defaultState);

  const cursor = buildStatefulOuterGearCursor(defaultState);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin: (resolved) => {
        const r = resolved as { $: object };
        return { ...r, $: { ...r.$, state: defaultState, defaultState } };
      },
      postProcess: (raw, c) => statefulPostProcess(raw, c as StatefulOuterGearCursor<S>),
    })) as StatefulOuterGearMapDefiner<RA, KM, DM, S>;
}

function createStatefulOuterGearListDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends OuterGearPlugDepList<RA>,
  S extends AnyState,
>(connector: ResComposerConnector, deps: DL, state: S): StatefulOuterGearListDefiner<RA, KM, DL, S> {
  const head = createStatefulOuterGearListPlugHead<RA, KM, DL, StatefulOuterGearCtx<RA, KM, S>, S>(deps, state);

  const cursor = buildStatefulOuterGearCursor(state);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin: (resolved) => {
        const arr = resolved as unknown[];
        const ctx = arr[arr.length - 1] as object;
        return [...arr.slice(0, -1), { ...ctx, state, defaultState: state }];
      },
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulOuterGearCursor<S>),
    })) as StatefulOuterGearListDefiner<RA, KM, DL, S>;
}

function createStatelessOuterGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends OuterGearPlugDepMap<RA>,
>(connector: ResComposerConnector, deps: DM): StatelessOuterGearMapDefiner<RA, KM, DM> {
  const head = createGearMapPlugHead<"outer", RA, KM, DM, PluginCtx<RA, KM>>("outer", deps);

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
>(connector: ResComposerConnector, deps: DL): StatelessOuterGearListDefiner<RA, KM, DL> {
  const head = createGearListPlugHead<"outer", RA, KM, DL, PluginCtx<RA, KM>>("outer", deps);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor: statelessOuterGearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessOuterGearListDefiner<RA, KM, DL>;
}

// #endregion

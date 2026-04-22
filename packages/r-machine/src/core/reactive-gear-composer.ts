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

import type { GearCursor } from "./gear.js";
import type { PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { assembleResMatrix, type BuildResPlugin } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";
import type {
  AnyState,
  StatefulReactiveGearListDefiner,
  StatefulReactiveGearMapDefiner,
} from "./stateful-reactive-gear.js";
import type { StatelessReactiveGearListDefiner, StatelessReactiveGearMapDefiner } from "./stateless-reactive-gear.js";

export interface ReactiveGearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearMapComposer<RA, KA, DM, S>;
  (): StatelessReactiveGearMapComposer<RA, KA, DM>;
}

export interface ReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearListComposer<RA, KA, DL, S>;
  (): StatelessReactiveGearListComposer<RA, KA, DL>;
}

interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearMapDefiner<RA, KA, DM, S>;
}

interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearListDefiner<RA, KA, DL, S>;
}

interface StatelessReactiveGearMapComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>, DM extends HandleMap<RA>> {
  readonly define: StatelessReactiveGearMapDefiner<RA, KA, DM>;
}

interface StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
> {
  readonly define: StatelessReactiveGearListDefiner<RA, KA, DL>;
}

// #region Runtime

// TODO: replace with real cmd/relay/getter/action runtime once available.
const baseGearCursor: GearCursor = {
  relay: (() => {
    throw new Error("relay: not yet implemented");
  }) as GearCursor["relay"],
  cmd: (() => {
    throw new Error("cmd: not yet implemented");
  }) as GearCursor["cmd"],
};

interface StatefulCursor<S extends AnyState> extends GearCursor {
  readonly getter: (...args: unknown[]) => unknown;
  readonly action: (...args: unknown[]) => unknown;
  readonly state: S;
}

function buildStatefulCursor<S extends AnyState>(state: S): StatefulCursor<S> {
  return {
    ...baseGearCursor,
    getter: () => {
      throw new Error("getter: not yet implemented");
    },
    action: () => {
      throw new Error("action: not yet implemented");
    },
    state,
  };
}

const cursor = {
  ...baseGearCursor,
  getter: () => {
    throw new Error("getter: not yet implemented");
  },
};

const meta: ResMatrixMeta = { family: "gear", isReactive: true };

function statefulPostProcess<S extends AnyState>(raw: unknown, cursor: StatefulCursor<S>): AnyRes {
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

export function createReactiveGearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(provider: ResWireProvider, deps: DM): ReactiveGearMapDepsComposer<RA, KA, DM> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: createStatelessReactiveGearMapDefiner<RA, KA, DM>(provider, deps),
      };
    }
    const [state] = args;
    return {
      define: createStatefulReactiveGearMapDefiner<RA, KA, DM, AnyState>(provider, deps, state),
    };
  }) as ReactiveGearMapDepsComposer<RA, KA, DM>;
}

export function createReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(provider: ResWireProvider, deps: DL): ReactiveGearListDepsComposer<RA, KA, DL> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: createStatelessReactiveGearListDefiner<RA, KA, DL>(provider, deps),
      };
    }
    const [state] = args;
    return {
      define: createStatefulReactiveGearListDefiner<RA, KA, DL, AnyState>(provider, deps, state),
    };
  }) as ReactiveGearListDepsComposer<RA, KA, DL>;
}

function createStatefulReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
>(provider: ResWireProvider, deps: DM, state: S): StatefulReactiveGearMapDefiner<RA, KA, DM, S> {
  type Ctx = PluginCtx<RA, KA> & { readonly state: S; readonly defaultState: S };
  type PlugHead = ResMapPlugHead<"gear", RA, KA, DM, Ctx> & { readonly defaultState: S };
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    deps,
    defaultState: state,
  } as PlugHead;

  const cursor = buildStatefulCursor(state);

  const buildPlugin: BuildResPlugin<PlugHead> = (resolved) =>
    ({
      ...resolved,
      $: { ...(resolved as { $: object }).$, state, defaultState: state },
    }) as typeof resolved;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix<PlugHead, unknown, AnyRes>({
      provider,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as StatefulCursor<S>),
    })) as StatefulReactiveGearMapDefiner<RA, KA, DM, S>;
}

function createStatefulReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
>(provider: ResWireProvider, deps: DL, state: S): StatefulReactiveGearListDefiner<RA, KA, DL, S> {
  type Ctx = PluginCtx<RA, KA> & { readonly state: S; readonly defaultState: S };
  type Head = ResListPlugHead<"gear", RA, KA, DL, Ctx> & { readonly defaultState: S };
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    deps,
    defaultState: state,
  } as Head;

  const cursor = buildStatefulCursor(state);

  const buildPlugin: BuildResPlugin<Head> = (resolved) => {
    const arr = resolved;
    const ctx = arr[arr.length - 1];
    return [...arr.slice(0, -1), { ...ctx, state, defaultState: state }] as unknown as typeof resolved;
  };

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix<Head, unknown, AnyRes>({
      provider,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as StatefulReactiveGearListDefiner<RA, KA, DL, S>;
}

function createStatelessReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(provider: ResWireProvider, deps: DM): StatelessReactiveGearMapDefiner<RA, KA, DM> {
  type PlugHead = ResMapPlugHead<"gear", RA, KA, DM, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    deps,
  } as PlugHead;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix<PlugHead, AnyRes, AnyRes>({
      provider,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessReactiveGearMapDefiner<RA, KA, DM>;
}

function createStatelessReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KA extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(provider: ResWireProvider, deps: DL): StatelessReactiveGearListDefiner<RA, KA, DL> {
  type PlugHead = ResListPlugHead<"gear", RA, KA, DL, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    deps,
  } as PlugHead;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix<PlugHead, AnyRes, AnyRes>({
      provider,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessReactiveGearListDefiner<RA, KA, DL>;
}

// #endregion

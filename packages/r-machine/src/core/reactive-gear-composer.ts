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
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { type BuildPlugin, composeResMatrix } from "./res-matrix-composer.js";
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
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearMapComposer<RA, KA, NM, S, T>;
  (): StatelessReactiveGearMapComposer<RA, KA, NM, T>;
}

export interface ReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearListComposer<RA, KA, NL, S, T>;
  (): StatelessReactiveGearListComposer<RA, KA, NL, T>;
}

interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  S extends AnyState,
  T,
> {
  readonly define: StatefulReactiveGearMapDefiner<RA["res"], KA, NM, S, T>;
}

interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  S extends AnyState,
  T,
> {
  readonly define: StatefulReactiveGearListDefiner<RA["res"], KA, NL, S, T>;
}

interface StatelessReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
> {
  readonly define: StatelessReactiveGearMapDefiner<RA["res"], KA, NM, T>;
}

interface StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
> {
  readonly define: StatelessReactiveGearListDefiner<RA["res"], KA, NL, T>;
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

function makeStatefulCursor<S extends AnyState>(state: S): StatefulCursor<S> {
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

const statelessCursor = {
  ...baseGearCursor,
  getter: () => {
    throw new Error("getter: not yet implemented");
  },
};

function buildReactiveMeta(isVertex: boolean): ResMatrixMeta {
  return { family: "gear", isReactive: true, isVertex };
}

type StateDef = readonly [string] | readonly [string, string];

function isStateDef(value: unknown): value is StateDef {
  return Array.isArray(value) && value.length >= 1 && value.length <= 2 && typeof value[0] === "string";
}

function statefulPostProcess<S extends AnyState>(raw: unknown, cursor: StatefulCursor<S>): AnyRes {
  if (!isStateDef(raw)) return raw as AnyRes;
  const [getterName, actionName] = raw;
  const resource: Record<string, unknown> = { [getterName]: cursor.getter() };
  if (actionName !== undefined) resource[actionName] = cursor.action();
  return resource as AnyRes;
}

function makeStatefulReactiveMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  S extends AnyState,
  T,
>(
  provider: ResWireProvider,
  namespaces: NM,
  state: S,
  isVertex: boolean
): StatefulReactiveGearMapDefiner<RA["res"], KA, NM, S, T> {
  type Ctx = PluginCtx<RA["res"], KA> & { readonly state: S; readonly defaultState: S };
  type Head = ResMapPlugHead<"gear", RA["res"], KA, NM, Ctx> & { readonly defaultState: S };
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    namespaces,
    defaultState: state,
  } as unknown as Head;

  const cursor = makeStatefulCursor(state);

  const buildPlugin: BuildPlugin<Head> = (resolved) =>
    ({
      ...resolved,
      $: { ...(resolved as { $: object }).$, state, defaultState: state },
    }) as typeof resolved;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    composeResMatrix<Head, unknown, AnyRes>({
      provider,
      meta: buildReactiveMeta(isVertex),
      head,
      namespaces,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as unknown as StatefulReactiveGearMapDefiner<RA["res"], KA, NM, S, T>;
}

function makeStatefulReactiveListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  S extends AnyState,
  T,
>(
  provider: ResWireProvider,
  namespaces: NL,
  state: S,
  isVertex: boolean
): StatefulReactiveGearListDefiner<RA["res"], KA, NL, S, T> {
  type Ctx = PluginCtx<RA["res"], KA> & { readonly state: S; readonly defaultState: S };
  type Head = ResListPlugHead<"gear", RA["res"], KA, NL, Ctx> & { readonly defaultState: S };
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    namespaces,
    defaultState: state,
  } as unknown as Head;

  const cursor = makeStatefulCursor(state);

  const buildPlugin: BuildPlugin<Head> = (resolved) => {
    const arr = resolved as unknown as unknown[];
    const ctx = arr[arr.length - 1] as object;
    return [...arr.slice(0, -1), { ...ctx, state, defaultState: state }] as unknown as typeof resolved;
  };

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    composeResMatrix<Head, unknown, AnyRes>({
      provider,
      meta: buildReactiveMeta(isVertex),
      head,
      namespaces,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as unknown as StatefulReactiveGearListDefiner<RA["res"], KA, NL, S, T>;
}

function makeStatelessReactiveMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NM, isVertex: boolean): StatelessReactiveGearMapDefiner<RA["res"], KA, NM, T> {
  type Head = ResMapPlugHead<"gear", RA["res"], KA, NM, PluginCtx<RA["res"], KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    namespaces,
  } as unknown as Head;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    composeResMatrix<Head, AnyRes, AnyRes>({
      provider,
      meta: buildReactiveMeta(isVertex),
      head,
      namespaces,
      cursor: statelessCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as StatelessReactiveGearMapDefiner<RA["res"], KA, NM, T>;
}

function makeStatelessReactiveListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
>(
  provider: ResWireProvider,
  namespaces: NL,
  isVertex: boolean
): StatelessReactiveGearListDefiner<RA["res"], KA, NL, T> {
  type Head = ResListPlugHead<"gear", RA["res"], KA, NL, PluginCtx<RA["res"], KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    namespaces,
  } as unknown as Head;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    composeResMatrix<Head, AnyRes, AnyRes>({
      provider,
      meta: buildReactiveMeta(isVertex),
      head,
      namespaces,
      cursor: statelessCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as StatelessReactiveGearListDefiner<RA["res"], KA, NL, T>;
}

export function makeReactiveGearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NM, isVertex: boolean): ReactiveGearMapDepsComposer<RA, KA, NM, T> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: makeStatelessReactiveMapDefiner<RA, KA, NM, T>(provider, namespaces, isVertex),
      };
    }
    const [state] = args;
    return {
      define: makeStatefulReactiveMapDefiner<RA, KA, NM, AnyState, T>(provider, namespaces, state, isVertex),
    };
  }) as unknown as ReactiveGearMapDepsComposer<RA, KA, NM, T>;
}

export function makeReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NL, isVertex: boolean): ReactiveGearListDepsComposer<RA, KA, NL, T> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: makeStatelessReactiveListDefiner<RA, KA, NL, T>(provider, namespaces, isVertex),
      };
    }
    const [state] = args;
    return {
      define: makeStatefulReactiveListDefiner<RA, KA, NL, AnyState, T>(provider, namespaces, state, isVertex),
    };
  }) as unknown as ReactiveGearListDepsComposer<RA, KA, NL, T>;
}

// #endregion

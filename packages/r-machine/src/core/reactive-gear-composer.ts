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
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearMapComposer<RA, KA, NM, S>;
  (): StatelessReactiveGearMapComposer<RA, KA, NM>;
}

export interface ReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearListComposer<RA, KA, NL, S>;
  (): StatelessReactiveGearListComposer<RA, KA, NL>;
}

interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearMapDefiner<RA, KA, NM, S>;
}

interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearListDefiner<RA, KA, NL, S>;
}

interface StatelessReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly define: StatelessReactiveGearMapDefiner<RA, KA, NM>;
}

interface StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly define: StatelessReactiveGearListDefiner<RA, KA, NL>;
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

const statelessCursor = {
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
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
>(provider: ResWireProvider, namespaces: NM): ReactiveGearMapDepsComposer<RA, KA, NM> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: createStatelessReactiveGearMapDefiner<RA, KA, NM>(provider, namespaces),
      };
    }
    const [state] = args;
    return {
      define: createStatefulReactiveGearMapDefiner<RA, KA, NM, AnyState>(provider, namespaces, state),
    };
  }) as ReactiveGearMapDepsComposer<RA, KA, NM>;
}

export function createReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
>(provider: ResWireProvider, namespaces: NL): ReactiveGearListDepsComposer<RA, KA, NL> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: createStatelessReactiveGearListDefiner<RA, KA, NL>(provider, namespaces),
      };
    }
    const [state] = args;
    return {
      define: createStatefulReactiveGearListDefiner<RA, KA, NL, AnyState>(provider, namespaces, state),
    };
  }) as ReactiveGearListDepsComposer<RA, KA, NL>;
}

function createStatefulReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
>(provider: ResWireProvider, namespaces: NM, state: S): StatefulReactiveGearMapDefiner<RA, KA, NM, S> {
  type Ctx = PluginCtx<RA, KA> & { readonly state: S; readonly defaultState: S };
  type PlugHead = ResMapPlugHead<"gear", RA, KA, NM, Ctx> & { readonly defaultState: S };
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    namespaces,
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
      namespaces,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as StatefulCursor<S>),
    })) as StatefulReactiveGearMapDefiner<RA, KA, NM, S>;
}

function createStatefulReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
>(provider: ResWireProvider, namespaces: NL, state: S): StatefulReactiveGearListDefiner<RA, KA, NL, S> {
  type Ctx = PluginCtx<RA, KA> & { readonly state: S; readonly defaultState: S };
  type Head = ResListPlugHead<"gear", RA, KA, NL, Ctx> & { readonly defaultState: S };
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    namespaces,
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
      namespaces,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as StatefulReactiveGearListDefiner<RA, KA, NL, S>;
}

function createStatelessReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
>(provider: ResWireProvider, namespaces: NM): StatelessReactiveGearMapDefiner<RA, KA, NM> {
  type PlugHead = ResMapPlugHead<"gear", RA, KA, NM, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    namespaces,
  } as PlugHead;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix<PlugHead, AnyRes, AnyRes>({
      provider,
      meta,
      head,
      namespaces,
      cursor: statelessCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessReactiveGearMapDefiner<RA, KA, NM>;
}

function createStatelessReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
>(provider: ResWireProvider, namespaces: NL): StatelessReactiveGearListDefiner<RA, KA, NL> {
  type PlugHead = ResListPlugHead<"gear", RA, KA, NL, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    namespaces,
  } as PlugHead;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix<PlugHead, AnyRes, AnyRes>({
      provider,
      meta,
      head,
      namespaces,
      cursor: statelessCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessReactiveGearListDefiner<RA, KA, NL>;
}

// #endregion

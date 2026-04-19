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
> {
  <S extends AnyState>(state: S): StatefulReactiveGearMapComposer<RA, KA, NM, S>;
  (): StatelessReactiveGearMapComposer<RA, KA, NM>;
}

export interface ReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearListComposer<RA, KA, NL, S>;
  (): StatelessReactiveGearListComposer<RA, KA, NL>;
}

interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearMapDefiner<RA["res"], KA, NM, S>;
}

interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearListDefiner<RA["res"], KA, NL, S>;
}

interface StatelessReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
> {
  readonly define: StatelessReactiveGearMapDefiner<RA["res"], KA, NM>;
}

interface StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
> {
  readonly define: StatelessReactiveGearListDefiner<RA["res"], KA, NL>;
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

function buildReactiveMeta(): ResMatrixMeta {
  return { family: "gear", isReactive: true };
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
>(provider: ResWireProvider, namespaces: NM, state: S): StatefulReactiveGearMapDefiner<RA["res"], KA, NM, S> {
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
      meta: buildReactiveMeta(),
      head,
      namespaces,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as unknown as StatefulReactiveGearMapDefiner<RA["res"], KA, NM, S>;
}

function makeStatefulReactiveListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  S extends AnyState,
>(provider: ResWireProvider, namespaces: NL, state: S): StatefulReactiveGearListDefiner<RA["res"], KA, NL, S> {
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
      meta: buildReactiveMeta(),
      head,
      namespaces,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => unknown | Promise<unknown>,
      buildPlugin,
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as unknown as StatefulReactiveGearListDefiner<RA["res"], KA, NL, S>;
}

function makeStatelessReactiveMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
>(provider: ResWireProvider, namespaces: NM): StatelessReactiveGearMapDefiner<RA["res"], KA, NM> {
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
      meta: buildReactiveMeta(),
      head,
      namespaces,
      cursor: statelessCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as StatelessReactiveGearMapDefiner<RA["res"], KA, NM>;
}

function makeStatelessReactiveListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
>(provider: ResWireProvider, namespaces: NL): StatelessReactiveGearListDefiner<RA["res"], KA, NL> {
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
      meta: buildReactiveMeta(),
      head,
      namespaces,
      cursor: statelessCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as StatelessReactiveGearListDefiner<RA["res"], KA, NL>;
}

export function makeReactiveGearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
>(provider: ResWireProvider, namespaces: NM): ReactiveGearMapDepsComposer<RA, KA, NM> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: makeStatelessReactiveMapDefiner<RA, KA, NM>(provider, namespaces),
      };
    }
    const [state] = args;
    return {
      define: makeStatefulReactiveMapDefiner<RA, KA, NM, AnyState>(provider, namespaces, state),
    };
  }) as unknown as ReactiveGearMapDepsComposer<RA, KA, NM>;
}

export function makeReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
>(provider: ResWireProvider, namespaces: NL): ReactiveGearListDepsComposer<RA, KA, NL> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: makeStatelessReactiveListDefiner<RA, KA, NL>(provider, namespaces),
      };
    }
    const [state] = args;
    return {
      define: makeStatefulReactiveListDefiner<RA, KA, NL, AnyState>(provider, namespaces, state),
    };
  }) as unknown as ReactiveGearListDepsComposer<RA, KA, NL>;
}

// #endregion

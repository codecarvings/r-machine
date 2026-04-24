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
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";
import { createResListPlugHead, createResMapPlugHead } from "./res-plug.js";
import {
  type AnyState,
  createStatefulReactiveGearListPlugHead,
  createStatefulReactiveGearMapPlugHead,
  type StatefulReactiveGearCtx,
  type StatefulReactiveGearListDefiner,
  type StatefulReactiveGearMapDefiner,
} from "./stateful-reactive-gear.js";
import type { StatelessReactiveGearListDefiner, StatelessReactiveGearMapDefiner } from "./stateless-reactive-gear.js";

export interface ReactiveGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearMapComposer<RA, KM, DM, S>;
  (): StatelessReactiveGearMapComposer<RA, KM, DM>;
}

export interface ReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> {
  <S extends AnyState>(state: S): StatefulReactiveGearListComposer<RA, KM, DL, S>;
  (): StatelessReactiveGearListComposer<RA, KM, DL>;
}

interface StatefulReactiveGearMapComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearMapDefiner<RA, KM, DM, S>;
}

interface StatefulReactiveGearListComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> {
  readonly define: StatefulReactiveGearListDefiner<RA, KM, DL, S>;
}

interface StatelessReactiveGearMapComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> {
  readonly define: StatelessReactiveGearMapDefiner<RA, KM, DM>;
}

interface StatelessReactiveGearListComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
> {
  readonly define: StatelessReactiveGearListDefiner<RA, KM, DL>;
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
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(connector: ResComposerConnector, deps: DM): ReactiveGearMapDepsComposer<RA, KM, DM> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: createStatelessReactiveGearMapDefiner<RA, KM, DM>(connector, deps),
      };
    }
    const [defaultState] = args;
    return {
      define: createStatefulReactiveGearMapDefiner<RA, KM, DM, AnyState>(connector, deps, defaultState),
    };
  }) as ReactiveGearMapDepsComposer<RA, KM, DM>;
}

export function createReactiveGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(connector: ResComposerConnector, deps: DL): ReactiveGearListDepsComposer<RA, KM, DL> {
  return ((...args: [] | [AnyState]) => {
    if (args.length === 0) {
      return {
        define: createStatelessReactiveGearListDefiner<RA, KM, DL>(connector, deps),
      };
    }
    const [state] = args;
    return {
      define: createStatefulReactiveGearListDefiner<RA, KM, DL, AnyState>(connector, deps, state),
    };
  }) as ReactiveGearListDepsComposer<RA, KM, DL>;
}

function createStatefulReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
>(connector: ResComposerConnector, deps: DM, defaultState: S): StatefulReactiveGearMapDefiner<RA, KM, DM, S> {
  const head = createStatefulReactiveGearMapPlugHead<RA, KM, DM, StatefulReactiveGearCtx<RA, KM, S>, S>(
    deps,
    defaultState
  );

  const cursor = buildStatefulCursor(defaultState);

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
      postProcess: (raw, c) => statefulPostProcess(raw, c as StatefulCursor<S>),
    })) as StatefulReactiveGearMapDefiner<RA, KM, DM, S>;
}

function createStatefulReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
>(connector: ResComposerConnector, deps: DL, state: S): StatefulReactiveGearListDefiner<RA, KM, DL, S> {
  const head = createStatefulReactiveGearListPlugHead<RA, KM, DL, StatefulReactiveGearCtx<RA, KM, S>, S>(deps, state);

  const cursor = buildStatefulCursor(state);

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
      postProcess: (raw, c) => statefulPostProcess(raw, c as unknown as StatefulCursor<S>),
    })) as StatefulReactiveGearListDefiner<RA, KM, DL, S>;
}

function createStatelessReactiveGearMapDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
>(connector: ResComposerConnector, deps: DM): StatelessReactiveGearMapDefiner<RA, KM, DM> {
  const head = createResMapPlugHead<"gear", RA, KM, DM, PluginCtx<RA, KM>>("gear", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    });
}

function createStatelessReactiveGearListDefiner<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
>(connector: ResComposerConnector, deps: DL): StatelessReactiveGearListDefiner<RA, KM, DL> {
  const head = createResListPlugHead<"gear", RA, KM, DL, PluginCtx<RA, KM>>("gear", deps);

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector: connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as StatelessReactiveGearListDefiner<RA, KM, DL>;
}

// #endregion

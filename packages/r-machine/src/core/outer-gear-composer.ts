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

import type { RMachineTypeError } from "#r-machine/errors";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead, type GearPlugKitMap } from "./gear-plug.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { GearMatrixMeta } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";
import {
  type AnyState,
  createStatefulOuterGearListPlugHead,
  createStatefulOuterGearMapPlugHead,
  type StatefulOuterGearCtx,
  type StatefulOuterGearCursor,
  type StatefulOuterGearListDefiner,
  type StatefulOuterGearMapDefiner,
} from "./stateful-outer-gear.js";
import type {
  StatelessOuterGearCursor,
  StatelessOuterGearListDefiner,
  StatelessOuterGearMapDefiner,
} from "./stateless-outer-gear.js";

type ValidOuterGearDepItem<RA extends AnyResAtlas, H> =
  H extends Handle<RA["valid@gear:outer"]>
    ? H
    : H extends string
      ? RMachineTypeError<`Namespace '${H}' is not valid for an outer gear plug.`>
      : RMachineTypeError<"This token does not reference a valid namespace for an outer gear plug.">;

export interface OuterGearComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  readonly withState: OuterGearMapStateComposer<RA, KM, {}>;
  readonly deps: OuterGearDepsComposer<RA, KM>;
}

interface OuterGearDepsComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>> {
  (): OuterGearMapComposer<RA, KM, {}>;
  <const DL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof DL]: ValidOuterGearDepItem<RA, DL[I]> }
  ): OuterGearListComposer<RA, KM, DL>;
  <const DM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof DM]: ValidOuterGearDepItem<RA, DM[K]> }
  ): OuterGearMapComposer<RA, KM, DM>;
}

interface OuterGearMapComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends HandleMap<RA>> {
  readonly withState: OuterGearMapStateComposer<RA, KM, DM>;
  readonly define: StatelessOuterGearMapDefiner<RA, KM, DM>;
}

interface OuterGearListComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DL extends HandleList<RA>> {
  readonly withState: OuterGearListStateComposer<RA, KM, DL>;
  readonly define: StatelessOuterGearListDefiner<RA, KM, DL>;
}

type OuterGearMapStateComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends HandleMap<RA>> = <
  S extends AnyState,
>(
  defaultState: S
) => StatefulOuterGearMapComposer<RA, KM, DM, S>;

type OuterGearListStateComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DL extends HandleList<RA>> = <
  S extends AnyState,
>(
  defaultState: S
) => StatefulOuterGearListComposer<RA, KM, DL, S>;

interface StatefulOuterGearMapComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DM extends HandleMap<RA>,
  S extends AnyState,
> {
  readonly define: StatefulOuterGearMapDefiner<RA, KM, DM, S>;
}

interface StatefulOuterGearListComposer<
  RA extends AnyResAtlas,
  KM extends GearPlugKitMap<RA>,
  DL extends HandleList<RA>,
  S extends AnyState,
> {
  readonly define: StatefulOuterGearListDefiner<RA, KM, DL, S>;
}

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
  const resource: Record<string, unknown> = { [getterName]: cursor.getter() };
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

  return { withState, deps };
}

function createOuterGearMapComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DM extends HandleMap<RA>>(
  connector: ResComposerConnector,
  deps: DM
): OuterGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    withState: () =>
      (<S extends AnyState>(defaultState: S) => ({
        define: createStatefulOuterGearMapDefiner<RA, KM, DM, S>(connector, deps, defaultState),
      })) as OuterGearMapComposer<RA, KM, DM>["withState"],
    define: () => createStatelessOuterGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createOuterGearListComposer<RA extends AnyResAtlas, KM extends GearPlugKitMap<RA>, DL extends HandleList<RA>>(
  connector: ResComposerConnector,
  deps: DL
): OuterGearListComposer<RA, KM, DL> {
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
  DM extends HandleMap<RA>,
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
  DL extends HandleList<RA>,
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
  DM extends HandleMap<RA>,
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
  DL extends HandleList<RA>,
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

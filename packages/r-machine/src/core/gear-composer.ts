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
import type { GearCursor, GearListDefiner, GearMapDefiner } from "./gear.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import {
  createReactiveGearListDepsComposer,
  createReactiveGearMapDepsComposer,
  type ReactiveGearListDepsComposer,
  type ReactiveGearMapDepsComposer,
} from "./reactive-gear-composer.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { assembleResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";

type ValidGearDepItem<RA extends AnyResAtlas, N> =
  N extends Handle<RA["shape@gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

export interface GearComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>> {
  readonly deps: GearDepsComposer<RA, KA>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, {}>;
  readonly define: GearMapDefiner<RA, KA, {}>;
}

interface GearDepsComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>> {
  (): GearMapDepsComposer<RA, KA, {}>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidGearDepItem<RA, NL[I]> }
  ): GearListDepsComposer<RA, KA, NL>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidGearDepItem<RA, NM[K]> }
  ): GearMapDepsComposer<RA, KA, NM>;
}

interface GearMapDepsComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>, DM extends HandleMap<RA>> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, DM>;
  readonly define: GearMapDefiner<RA, KA, DM>;
}

interface GearListDepsComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>, DL extends HandleList<RA>> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, DL>;
  readonly define: GearListDefiner<RA, KA, DL>;
}

// #region Runtime

// TODO: replace with real cmd/relay runtime once available.
const cursor: GearCursor = {
  relay: (() => {
    throw new Error("relay: not yet implemented");
  }) as GearCursor["relay"],
  cmd: (() => {
    throw new Error("cmd: not yet implemented");
  }) as GearCursor["cmd"],
};

const meta: ResMatrixMeta = { family: "gear", isReactive: false };

export function createGearComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>>(
  provider: ResWireProvider
): GearComposer<RA, KA> {
  const reactive = createReactiveGearMapDepsComposer<RA, KA, {}>(provider, {});
  const define = createGearMapDefiner<RA, KA, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createGearMapDepsComposer<RA, KA, any>(provider, mask.deps);
    } else {
      return createGearListDepsComposer<RA, KA, any>(provider, mask.deps);
    }
  }) as GearDepsComposer<RA, KA>;

  return {
    deps,
    reactive,
    define,
  };
}

function createGearMapDepsComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>, DM extends HandleMap<RA>>(
  provider: ResWireProvider,
  deps: DM
): GearMapDepsComposer<RA, KA, DM> {
  return lazyGetters<GearMapDepsComposer<RA, KA, DM>>({
    reactive: () => createReactiveGearMapDepsComposer<RA, KA, DM>(provider, deps),
    define: () => createGearMapDefiner<RA, KA, DM>(provider, deps),
  });
}

function createGearListDepsComposer<RA extends AnyResAtlas, KA extends HandleMap<RA>, DL extends HandleList<RA>>(
  provider: ResWireProvider,
  deps: DL
): GearListDepsComposer<RA, KA, DL> {
  return lazyGetters<GearListDepsComposer<RA, KA, DL>>({
    reactive: () => createReactiveGearListDepsComposer<RA, KA, DL>(provider, deps),
    define: () => createGearListDefiner<RA, KA, DL>(provider, deps),
  });
}

function createGearMapDefiner<RA extends AnyResAtlas, KA extends HandleMap<RA>, DM extends HandleMap<RA>>(
  provider: ResWireProvider,
  deps: DM
): GearMapDefiner<RA, KA, DM> {
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
    })) as GearMapDefiner<RA, KA, DM>;
}

function createGearListDefiner<RA extends AnyResAtlas, KA extends HandleMap<RA>, DL extends HandleList<RA>>(
  provider: ResWireProvider,
  deps: DL
): GearListDefiner<RA, KA, DL> {
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
    })) as GearListDefiner<RA, KA, DL>;
}

// #endregion

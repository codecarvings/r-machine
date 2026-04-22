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
import { createResListPlugHead, createResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";

type ValidGearDepItem<RA extends AnyResAtlas, N> =
  N extends Handle<RA["shape@gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

export interface GearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>> {
  readonly deps: GearDepsComposer<RA, KM>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KM, {}>;
  readonly define: GearMapDefiner<RA, KM, {}>;
}

interface GearDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>> {
  (): GearMapDepsComposer<RA, KM, {}>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidGearDepItem<RA, NL[I]> }
  ): GearListDepsComposer<RA, KM, NL>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidGearDepItem<RA, NM[K]> }
  ): GearMapDepsComposer<RA, KM, NM>;
}

interface GearMapDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KM, DM>;
  readonly define: GearMapDefiner<RA, KM, DM>;
}

interface GearListDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KM, DL>;
  readonly define: GearListDefiner<RA, KM, DL>;
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

export function createGearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>>(
  provider: ResWireProvider
): GearComposer<RA, KM> {
  const reactive = createReactiveGearMapDepsComposer<RA, KM, {}>(provider, {});
  const define = createGearMapDefiner<RA, KM, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createGearMapDepsComposer<RA, KM, any>(provider, mask.deps);
    } else {
      return createGearListDepsComposer<RA, KM, any>(provider, mask.deps);
    }
  }) as GearDepsComposer<RA, KM>;

  return {
    deps,
    reactive,
    define,
  };
}

function createGearMapDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  provider: ResWireProvider,
  deps: DM
): GearMapDepsComposer<RA, KM, DM> {
  return lazyGetters<GearMapDepsComposer<RA, KM, DM>>({
    reactive: () => createReactiveGearMapDepsComposer<RA, KM, DM>(provider, deps),
    define: () => createGearMapDefiner<RA, KM, DM>(provider, deps),
  });
}

function createGearListDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  provider: ResWireProvider,
  deps: DL
): GearListDepsComposer<RA, KM, DL> {
  return lazyGetters<GearListDepsComposer<RA, KM, DL>>({
    reactive: () => createReactiveGearListDepsComposer<RA, KM, DL>(provider, deps),
    define: () => createGearListDefiner<RA, KM, DL>(provider, deps),
  });
}

function createGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  provider: ResWireProvider,
  deps: DM
): GearMapDefiner<RA, KM, DM> {
  const head = createResMapPlugHead<"gear", RA, KM, DM, PluginCtx<RA, KM>>("gear", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix({
      provider,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    });
}

function createGearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  provider: ResWireProvider,
  deps: DL
): GearListDefiner<RA, KM, DL> {
  const head = createResListPlugHead<"gear", RA, KM, DL, PluginCtx<RA, KM>>("gear", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    assembleResMatrix({
      provider,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    });
}

// #endregion

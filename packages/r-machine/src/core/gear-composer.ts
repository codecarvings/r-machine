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
import type { ExperimentalFlags } from "./experimental-flags.js";
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
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { createResMatrix } from "./res-matrix.js";
import { createResListPlugHead, createResMapPlugHead } from "./res-plug.js";

type ValidGearDepItem<RA extends AnyResAtlas, N> =
  N extends Handle<RA["shape@gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

export type GearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, EF extends ExperimentalFlags> = {
  readonly deps: GearDepsComposer<RA, KM, EF>;
  readonly define: GearMapDefiner<RA, KM, {}>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly reactive: ReactiveGearMapDepsComposer<RA, KM, {}>;
    }
  : {});

interface GearDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, EF extends ExperimentalFlags> {
  (): GearMapDepsComposer<RA, KM, {}, EF>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidGearDepItem<RA, NL[I]> }
  ): GearListDepsComposer<RA, KM, NL, EF>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidGearDepItem<RA, NM[K]> }
  ): GearMapDepsComposer<RA, KM, NM, EF>;
}

type GearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  EF extends ExperimentalFlags,
> = {
  readonly define: GearMapDefiner<RA, KM, DM>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly reactive: ReactiveGearMapDepsComposer<RA, KM, DM>;
    }
  : {});

type GearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  EF extends ExperimentalFlags,
> = {
  readonly define: GearListDefiner<RA, KM, DL>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly reactive: ReactiveGearListDepsComposer<RA, KM, DL>;
    }
  : {});

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

export function createGearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, EF extends ExperimentalFlags>(
  connector: ResComposerConnector
): GearComposer<RA, KM, EF> {
  const reactive = createReactiveGearMapDepsComposer<RA, KM, {}>(connector, {});
  const define = createGearMapDefiner<RA, KM, {}>(connector, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createGearMapDepsComposer<RA, KM, any, EF>(connector, mask.deps);
    } else {
      return createGearListDepsComposer<RA, KM, any, EF>(connector, mask.deps);
    }
  }) as GearDepsComposer<RA, KM, EF>;

  return {
    deps,
    reactive,
    define,
  };
}

function createGearMapDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  EF extends ExperimentalFlags,
>(connector: ResComposerConnector, deps: DM): GearMapDepsComposer<RA, KM, DM, EF> {
  return lazyGetters({
    reactive: () => createReactiveGearMapDepsComposer<RA, KM, DM>(connector, deps),
    define: () => createGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createGearListDepsComposer<
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  EF extends ExperimentalFlags,
>(connector: ResComposerConnector, deps: DL): GearListDepsComposer<RA, KM, DL, EF> {
  return lazyGetters({
    reactive: () => createReactiveGearListDepsComposer<RA, KM, DL>(connector, deps),
    define: () => createGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  connector: ResComposerConnector,
  deps: DM
): GearMapDefiner<RA, KM, DM> {
  const head = createResMapPlugHead<"gear", RA, KM, DM, PluginCtx<RA, KM>>("gear", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    });
}

function createGearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  connector: ResComposerConnector,
  deps: DL
): GearListDefiner<RA, KM, DL> {
  const head = createResListPlugHead<"gear", RA, KM, DL, PluginCtx<RA, KM>>("gear", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    });
}

// #endregion

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
import type { NamespaceRef } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { assembleResMatrix } from "./res-matrix.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";

type ValidGearDepItem<RA extends AnyResAtlas, N> =
  N extends NamespaceRef<RA["shape@gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

export interface GearComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> {
  readonly deps: GearDepsComposer<RA, KA>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, {}>;
  readonly define: GearMapDefiner<RA, KA, {}>;
}

interface GearDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>> {
  (): GearMapDepsComposer<RA, KA, {}>;
  <const NL extends readonly NamespaceRef<RA["shape"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidGearDepItem<RA, NL[I]> }
  ): GearListDepsComposer<RA, KA, NL>;
  <const NM extends { readonly [k: string]: NamespaceRef<RA["shape"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidGearDepItem<RA, NM[K]> }
  ): GearMapDepsComposer<RA, KA, NM>;
}

interface GearMapDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, NM>;
  readonly define: GearMapDefiner<RA, KA, NM>;
}

interface GearListDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, NL>;
  readonly define: GearListDefiner<RA, KA, NL>;
}

// #region Runtime

// TODO: replace with real cmd/relay runtime once available.
const gearCursor: GearCursor = {
  relay: (() => {
    throw new Error("relay: not yet implemented");
  }) as GearCursor["relay"],
  cmd: (() => {
    throw new Error("cmd: not yet implemented");
  }) as GearCursor["cmd"],
};

const meta: ResMatrixMeta = { family: "gear", isReactive: false };

export function createGearComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>>(
  provider: ResWireProvider
): GearComposer<RA, KA> {
  const reactive = createReactiveGearMapDepsComposer<RA, KA, {}>(provider, {});
  const define = createGearMapDefiner<RA, KA, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createGearMapDepsComposer<RA, KA, any>(provider, mask.namespaces);
    } else {
      return createGearListDepsComposer<RA, KA, any>(provider, mask.namespaces);
    }
  }) as GearDepsComposer<RA, KA>;

  return {
    deps,
    reactive,
    define,
  };
}

function createGearMapDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>(
  provider: ResWireProvider,
  namespaces: NM
): GearMapDepsComposer<RA, KA, NM> {
  return lazyGetters<GearMapDepsComposer<RA, KA, NM>>({
    reactive: () => createReactiveGearMapDepsComposer<RA, KA, NM>(provider, namespaces),
    define: () => createGearMapDefiner<RA, KA, NM>(provider, namespaces),
  });
}

function createGearListDepsComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>(
  provider: ResWireProvider,
  namespaces: NL
): GearListDepsComposer<RA, KA, NL> {
  return lazyGetters<GearListDepsComposer<RA, KA, NL>>({
    reactive: () => createReactiveGearListDepsComposer<RA, KA, NL>(provider, namespaces),
    define: () => createGearListDefiner<RA, KA, NL>(provider, namespaces),
  });
}

function createGearMapDefiner<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>(
  provider: ResWireProvider,
  namespaces: NM
): GearMapDefiner<RA, KA, NM> {
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
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as GearMapDefiner<RA, KA, NM>;
}

function createGearListDefiner<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>(
  provider: ResWireProvider,
  namespaces: NL
): GearListDefiner<RA, KA, NL> {
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
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as GearListDefiner<RA, KA, NL>;
}

// #endregion

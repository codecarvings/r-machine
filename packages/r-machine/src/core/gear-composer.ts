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
import type { GearCursor, GearListDefiner, GearMapDefiner } from "./gear.js";
import type { PluginCtx } from "./plug.js";
import {
  makeReactiveGearListDepsComposer,
  makeReactiveGearMapDepsComposer,
  type ReactiveGearListDepsComposer,
  type ReactiveGearMapDepsComposer,
} from "./reactive-gear-composer.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import { isNamespace, type NamespaceRef } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { composeResMatrix } from "./res-matrix-composer.js";
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

function buildGearMeta(): ResMatrixMeta {
  return { family: "gear", isReactive: false };
}

function makeGearMapDefiner<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>(
  provider: ResWireProvider,
  namespaces: NM
): GearMapDefiner<RA, KA, NM> {
  type Head = ResMapPlugHead<"gear", RA, KA, NM, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    namespaces,
  } as unknown as Head;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    composeResMatrix<Head, AnyRes, AnyRes>({
      provider,
      meta: buildGearMeta(),
      head,
      namespaces,
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as GearMapDefiner<RA, KA, NM>;
}

function makeGearListDefiner<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>(
  provider: ResWireProvider,
  namespaces: NL
): GearListDefiner<RA, KA, NL> {
  type Head = ResListPlugHead<"gear", RA, KA, NL, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    namespaces,
  } as unknown as Head;

  return ((factory: (plugin: never, cursor: never) => unknown) =>
    composeResMatrix<Head, AnyRes, AnyRes>({
      provider,
      meta: buildGearMeta(),
      head,
      namespaces,
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as GearListDefiner<RA, KA, NL>;
}

function makeGearMapDepsSubComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>>(
  provider: ResWireProvider,
  namespaces: NM
): GearMapDepsComposer<RA, KA, NM> {
  return {
    reactive: makeReactiveGearMapDepsComposer<RA, KA, NM>(provider, namespaces),
    define: makeGearMapDefiner<RA, KA, NM>(provider, namespaces),
  };
}

function makeGearListDepsSubComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>>(
  provider: ResWireProvider,
  namespaces: NL
): GearListDepsComposer<RA, KA, NL> {
  return {
    reactive: makeReactiveGearListDepsComposer<RA, KA, NL>(provider, namespaces),
    define: makeGearListDefiner<RA, KA, NL>(provider, namespaces),
  };
}

export function createGearComposer<RA extends AnyResAtlas, KA extends NamespaceMap<RA>>(
  provider: ResWireProvider
): GearComposer<RA, KA> {
  const reactiveTopLevel = makeReactiveGearMapDepsComposer<RA, KA, {}>(provider, {});
  const defineTopLevel = makeGearMapDefiner<RA, KA, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    if (args.length === 0) {
      return { reactive: reactiveTopLevel, define: defineTopLevel };
    }
    if (args.length === 1 && !isNamespace(args[0] as NamespaceRef<any>)) {
      return makeGearMapDepsSubComposer<RA, KA, NamespaceMap<RA>>(provider, args[0] as NamespaceMap<RA>);
    }
    return makeGearListDepsSubComposer<RA, KA, NamespaceList<RA>>(provider, args as unknown as NamespaceList<RA>);
  }) as unknown as GearDepsComposer<RA, KA>;

  return {
    deps,
    reactive: reactiveTopLevel,
    define: defineTopLevel,
  };
}

// #endregion

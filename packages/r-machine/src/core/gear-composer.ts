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
import type { GearCursor, GearListDefiner, GearMapDefiner, GearTag } from "./gear.js";
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
import type { VertexGearTag } from "./vertex-gear.js";

type ValidGearDepItem<RA extends AnyResAtlas, N> =
  N extends NamespaceRef<RA["gear"]>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid gear namespace.`>
      : RMachineTypeError<"This token does not reference a valid gear namespace.">;

export interface GearComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  T extends GearTag | VertexGearTag = GearTag,
> {
  readonly deps: GearDepsComposer<RA, KA, T>;
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, {}, T>;
  readonly define: GearMapDefiner<RA["res"], KA, {}, T>;
}

interface GearDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  T extends GearTag | VertexGearTag,
> {
  (): GearMapDepsComposer<RA, KA, {}, T>;
  <const NL extends readonly NamespaceRef<RA["res"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidGearDepItem<RA, NL[I]> }
  ): GearListDepsComposer<RA, KA, NL, T>;
  <const NM extends { readonly [k: string]: NamespaceRef<RA["res"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidGearDepItem<RA, NM[K]> }
  ): GearMapDepsComposer<RA, KA, NM, T>;
}

interface GearMapDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
> {
  readonly reactive: ReactiveGearMapDepsComposer<RA, KA, NM, T>;
  readonly define: GearMapDefiner<RA["res"], KA, NM, T>;
}

interface GearListDepsComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
> {
  readonly reactive: ReactiveGearListDepsComposer<RA, KA, NL, T>;
  readonly define: GearListDefiner<RA["res"], KA, NL, T>;
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

function buildGearMeta(isVertex: boolean): ResMatrixMeta {
  return { family: "gear", isReactive: false, isVertex };
}

function makeGearMapDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NM, isVertex: boolean): GearMapDefiner<RA["res"], KA, NM, T> {
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
      meta: buildGearMeta(isVertex),
      head,
      namespaces,
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as GearMapDefiner<RA["res"], KA, NM, T>;
}

function makeGearListDefiner<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NL, isVertex: boolean): GearListDefiner<RA["res"], KA, NL, T> {
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
      meta: buildGearMeta(isVertex),
      head,
      namespaces,
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => AnyRes | Promise<AnyRes>,
    })) as unknown as GearListDefiner<RA["res"], KA, NL, T>;
}

function makeGearMapDepsSubComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NM, isVertex: boolean): GearMapDepsComposer<RA, KA, NM, T> {
  return {
    reactive: makeReactiveGearMapDepsComposer<RA, KA, NM, T>(provider, namespaces, isVertex),
    define: makeGearMapDefiner<RA, KA, NM, T>(provider, namespaces, isVertex),
  };
}

function makeGearListDepsSubComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
  T,
>(provider: ResWireProvider, namespaces: NL, isVertex: boolean): GearListDepsComposer<RA, KA, NL, T> {
  return {
    reactive: makeReactiveGearListDepsComposer<RA, KA, NL, T>(provider, namespaces, isVertex),
    define: makeGearListDefiner<RA, KA, NL, T>(provider, namespaces, isVertex),
  };
}

export function createGearComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA["res"]>,
  T extends GearTag | VertexGearTag = GearTag,
>(provider: ResWireProvider, isVertex: boolean): GearComposer<RA, KA, T> {
  const reactiveTopLevel = makeReactiveGearMapDepsComposer<RA, KA, {}, T>(provider, {}, isVertex);
  const defineTopLevel = makeGearMapDefiner<RA, KA, {}, T>(provider, {}, isVertex);

  const deps = ((...args: unknown[]) => {
    if (args.length === 0) {
      return { reactive: reactiveTopLevel, define: defineTopLevel };
    }
    if (args.length === 1 && !isNamespace(args[0] as NamespaceRef<any>)) {
      return makeGearMapDepsSubComposer<RA, KA, NamespaceMap<RA["res"]>, T>(
        provider,
        args[0] as NamespaceMap<RA["res"]>,
        isVertex
      );
    }
    return makeGearListDepsSubComposer<RA, KA, NamespaceList<RA["res"]>, T>(
      provider,
      args as unknown as NamespaceList<RA["res"]>,
      isVertex
    );
  }) as unknown as GearDepsComposer<RA, KA, T>;

  return {
    deps,
    reactive: reactiveTopLevel,
    define: defineTopLevel,
  };
}

// #endregion

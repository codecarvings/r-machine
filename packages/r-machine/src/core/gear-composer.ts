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

import type { GearCursor, GearListComposer, GearMapComposer } from "./gear.js";
import type { PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { composeResMatrix } from "./res-matrix-composer.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";

// TODO: replace with real cmd/relay runtime once available.
const gearCursor: GearCursor = {
  relay: (() => {
    throw new Error("relay: not yet implemented");
  }) as GearCursor["relay"],
  cmd: (() => {
    throw new Error("cmd: not yet implemented");
  }) as GearCursor["cmd"],
};

function buildMeta(isVertex: boolean): ResMatrixMeta {
  return { family: "gear", isReactive: false, isVertex };
}

export function createGearMapComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  T,
>(provider: ResWireProvider, namespaces: NM, isVertex: boolean): GearMapComposer<RA, KA, NM, T> {
  type Head = ResMapPlugHead<"gear", RA, KA, NM, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "map",
    namespaces,
  } as unknown as Head;

  return (<R extends AnyRes>(factory: Parameters<GearMapComposer<RA, KA, NM, T>>[0]) =>
    composeResMatrix<Head, R, R & T>({
      provider,
      meta: buildMeta(isVertex),
      head,
      namespaces,
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => R | Promise<R>,
    })) as GearMapComposer<RA, KA, NM, T>;
}

export function createGearListComposer<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  T,
>(provider: ResWireProvider, namespaces: NL, isVertex: boolean): GearListComposer<RA, KA, NL, T> {
  type Head = ResListPlugHead<"gear", RA, KA, NL, PluginCtx<RA, KA>>;
  const head = {
    area: "res",
    family: "gear",
    mode: "list",
    namespaces,
  } as unknown as Head;

  return (<R extends AnyRes>(factory: Parameters<GearListComposer<RA, KA, NL, T>>[0]) =>
    composeResMatrix<Head, R, R & T>({
      provider,
      meta: buildMeta(isVertex),
      head,
      namespaces,
      cursor: gearCursor,
      userFactory: factory as (plugin: unknown, cursor: never) => R | Promise<R>,
    })) as GearListComposer<RA, KA, NL, T>;
}

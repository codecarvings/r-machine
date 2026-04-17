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

import type { AnyLocale } from "#r-machine/locale";
import type { LocaleAwarePluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { composeResMatrix } from "./res-matrix-composer.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";
import type { ShellListComposer, ShellMapComposer } from "./shell.js";

const meta: ResMatrixMeta = { family: "shell", isReactive: false, isVertex: false };

export function createShellMapComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
>(provider: ResWireProvider, namespaces: NM): ShellMapComposer<RA, L, KA, NM> {
  type Head = ResMapPlugHead<"shell", RA, KA, NM, LocaleAwarePluginCtx<RA, L, KA>>;
  const head = {
    area: "res",
    family: "shell",
    mode: "map",
    namespaces,
  } as unknown as Head;

  return (<R extends AnyRes>(factory: Parameters<ShellMapComposer<RA, L, KA, NM>>[0]) =>
    composeResMatrix<Head, R, R>({
      provider,
      meta,
      head,
      namespaces,
      cursor: undefined,
      userFactory: ((plugin: unknown) => factory(plugin as never)) as (
        plugin: unknown,
        cursor: never
      ) => R | Promise<R>,
    })) as ShellMapComposer<RA, L, KA, NM>;
}

export function createShellListComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
>(provider: ResWireProvider, namespaces: NL): ShellListComposer<RA, L, KA, NL> {
  type Head = ResListPlugHead<"shell", RA, KA, NL, LocaleAwarePluginCtx<RA, L, KA>>;
  const head = {
    area: "res",
    family: "shell",
    mode: "list",
    namespaces,
  } as unknown as Head;

  return (<R extends AnyRes>(factory: Parameters<ShellListComposer<RA, L, KA, NL>>[0]) =>
    composeResMatrix<Head, R, R>({
      provider,
      meta,
      head,
      namespaces,
      cursor: undefined,
      userFactory: ((plugin: unknown) => factory(plugin as never)) as (
        plugin: unknown,
        cursor: never
      ) => R | Promise<R>,
    })) as ShellListComposer<RA, L, KA, NL>;
}

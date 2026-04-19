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
import type { AnyLocale } from "#r-machine/locale";
import type { LocaleAwarePluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import { isNamespace, type NamespaceRef } from "./res-domain.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import type { ResMatrixMeta } from "./res-matrix.js";
import { composeResMatrix } from "./res-matrix-composer.js";
import type { ResListPlugHead, ResMapPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";
import type { ShellListDefiner, ShellMapDefiner } from "./shell.js";

type ShellDepsNamespace<RA extends AnyResAtlas, BGL extends NamespaceList<RA["res"]>> =
  | Extract<keyof RA["shell"], string>
  | BGL[number];

type ShellDepsNamespaceRef<RA extends AnyResAtlas, BGL extends NamespaceList<RA["res"]>> = NamespaceRef<
  Pick<RA["res"], ShellDepsNamespace<RA, BGL> & keyof RA["res"]>
>;

type ValidShellDepItem<RA extends AnyResAtlas, BGL extends NamespaceList<RA["res"]>, N> =
  N extends ShellDepsNamespaceRef<RA, BGL>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid shell namespace (and not declared in bridgeGears).`>
      : RMachineTypeError<"This token does not reference a valid shell namespace (or declared bridgeGear).">;

export interface ShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends NamespaceList<RA["res"]>,
  KA extends NamespaceMap<RA["res"]>,
> {
  readonly deps: ShellDepsComposer<RA, L, BGL, KA>;
  readonly define: ShellMapDefiner<RA["res"], L, KA, {}>;
}

interface ShellDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends NamespaceList<RA["res"]>,
  KA extends NamespaceMap<RA["res"]>,
> {
  (): ShellMapDepsComposer<RA, L, KA, {}>;
  <const NL extends readonly NamespaceRef<RA["res"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidShellDepItem<RA, BGL, NL[I]> }
  ): ShellListDepsComposer<RA, L, KA, NL>;
  <const NM extends { readonly [k: string]: NamespaceRef<RA["res"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidShellDepItem<RA, BGL, NM[K]> }
  ): ShellMapDepsComposer<RA, L, KA, NM>;
}

interface ShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
> {
  readonly define: ShellMapDefiner<RA["res"], L, KA, NM>;
}

interface ShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
> {
  readonly define: ShellListDefiner<RA["res"], L, KA, NL>;
}

// #region Runtime

const shellMeta: ResMatrixMeta = { family: "shell", isReactive: false, isVertex: false };

function makeShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["res"]>,
  NM extends NamespaceMap<RA["res"]>,
>(provider: ResWireProvider, namespaces: NM): ShellMapDefiner<RA["res"], L, KA, NM> {
  type Head = ResMapPlugHead<"shell", RA["res"], KA, NM, LocaleAwarePluginCtx<RA["res"], L, KA>>;
  const head = {
    area: "res",
    family: "shell",
    mode: "map",
    namespaces,
  } as unknown as Head;

  return ((factory: (plugin: never) => unknown) =>
    composeResMatrix<Head, AnyRes, AnyRes>({
      provider,
      meta: shellMeta,
      head,
      namespaces,
      cursor: undefined,
      userFactory: ((plugin: unknown) => factory(plugin as never)) as (
        plugin: unknown,
        cursor: never
      ) => AnyRes | Promise<AnyRes>,
    })) as unknown as ShellMapDefiner<RA["res"], L, KA, NM>;
}

function makeShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["res"]>,
  NL extends NamespaceList<RA["res"]>,
>(provider: ResWireProvider, namespaces: NL): ShellListDefiner<RA["res"], L, KA, NL> {
  type Head = ResListPlugHead<"shell", RA["res"], KA, NL, LocaleAwarePluginCtx<RA["res"], L, KA>>;
  const head = {
    area: "res",
    family: "shell",
    mode: "list",
    namespaces,
  } as unknown as Head;

  return ((factory: (plugin: never) => unknown) =>
    composeResMatrix<Head, AnyRes, AnyRes>({
      provider,
      meta: shellMeta,
      head,
      namespaces,
      cursor: undefined,
      userFactory: ((plugin: unknown) => factory(plugin as never)) as (
        plugin: unknown,
        cursor: never
      ) => AnyRes | Promise<AnyRes>,
    })) as unknown as ShellListDefiner<RA["res"], L, KA, NL>;
}

export function createShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends NamespaceList<RA["res"]>,
  KA extends NamespaceMap<RA["res"]>,
>(provider: ResWireProvider): ShellComposer<RA, L, BGL, KA> {
  const defineTopLevel = makeShellMapDefiner<RA, L, KA, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    if (args.length === 0) {
      return { define: defineTopLevel };
    }
    if (args.length === 1 && !isNamespace(args[0] as NamespaceRef<any>)) {
      return {
        define: makeShellMapDefiner<RA, L, KA, NamespaceMap<RA["res"]>>(provider, args[0] as NamespaceMap<RA["res"]>),
      };
    }
    return {
      define: makeShellListDefiner<RA, L, KA, NamespaceList<RA["res"]>>(
        provider,
        args as unknown as NamespaceList<RA["res"]>
      ),
    };
  }) as unknown as ShellDepsComposer<RA, L, BGL, KA>;

  return {
    deps,
    define: defineTopLevel,
  };
}

// #endregion

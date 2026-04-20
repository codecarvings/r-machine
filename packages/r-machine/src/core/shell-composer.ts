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

type ShellDepsNamespace<RA extends AnyResAtlas, BGL extends NamespaceList<RA["shape"]>> =
  | Extract<keyof RA["shape@shell:*"], string>
  | BGL[number];

type ShellDepsNamespaceRef<RA extends AnyResAtlas, BGL extends NamespaceList<RA["shape"]>> = NamespaceRef<
  Pick<RA["shape"], ShellDepsNamespace<RA, BGL> & keyof RA["shape"]>
>;

type ValidShellDepItem<RA extends AnyResAtlas, BGL extends NamespaceList<RA["shape"]>, N> =
  N extends ShellDepsNamespaceRef<RA, BGL>
    ? N
    : N extends string
      ? RMachineTypeError<`Namespace '${N}' is not a valid shell namespace (and not declared in bridgeGears).`>
      : RMachineTypeError<"This token does not reference a valid shell namespace (or declared bridgeGear).">;

export interface ShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends NamespaceList<RA["shape"]>,
  KA extends NamespaceMap<RA["shape"]>,
> {
  readonly deps: ShellDepsComposer<RA, L, BGL, KA>;
  readonly define: ShellMapDefiner<RA["shape"], L, KA, {}>;
}

interface ShellDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends NamespaceList<RA["shape"]>,
  KA extends NamespaceMap<RA["shape"]>,
> {
  (): ShellMapDepsComposer<RA, L, KA, {}>;
  <const NL extends readonly NamespaceRef<RA["shape"]>[]>(
    ...namespaces: { readonly [I in keyof NL]: ValidShellDepItem<RA, BGL, NL[I]> }
  ): ShellListDepsComposer<RA, L, KA, NL>;
  <const NM extends { readonly [k: string]: NamespaceRef<RA["shape"]> }>(
    namespaces: { readonly [K in keyof NM]: ValidShellDepItem<RA, BGL, NM[K]> }
  ): ShellMapDepsComposer<RA, L, KA, NM>;
}

interface ShellMapDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["shape"]>,
  NM extends NamespaceMap<RA["shape"]>,
> {
  readonly define: ShellMapDefiner<RA["shape"], L, KA, NM>;
}

interface ShellListDepsComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["shape"]>,
  NL extends NamespaceList<RA["shape"]>,
> {
  readonly define: ShellListDefiner<RA["shape"], L, KA, NL>;
}

// #region Runtime

const shellMeta: ResMatrixMeta = { family: "shell", isReactive: false };

function makeShellMapDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["shape"]>,
  NM extends NamespaceMap<RA["shape"]>,
>(provider: ResWireProvider, namespaces: NM): ShellMapDefiner<RA["shape"], L, KA, NM> {
  type Head = ResMapPlugHead<"shell", RA["shape"], KA, NM, LocaleAwarePluginCtx<RA["shape"], L, KA>>;
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
    })) as unknown as ShellMapDefiner<RA["shape"], L, KA, NM>;
}

function makeShellListDefiner<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA["shape"]>,
  NL extends NamespaceList<RA["shape"]>,
>(provider: ResWireProvider, namespaces: NL): ShellListDefiner<RA["shape"], L, KA, NL> {
  type Head = ResListPlugHead<"shell", RA["shape"], KA, NL, LocaleAwarePluginCtx<RA["shape"], L, KA>>;
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
    })) as unknown as ShellListDefiner<RA["shape"], L, KA, NL>;
}

export function createShellComposer<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  BGL extends NamespaceList<RA["shape"]>,
  KA extends NamespaceMap<RA["shape"]>,
>(provider: ResWireProvider): ShellComposer<RA, L, BGL, KA> {
  const defineTopLevel = makeShellMapDefiner<RA, L, KA, {}>(provider, {});

  const deps = ((...args: unknown[]) => {
    if (args.length === 0) {
      return { define: defineTopLevel };
    }
    if (args.length === 1 && !isNamespace(args[0] as NamespaceRef<any>)) {
      return {
        define: makeShellMapDefiner<RA, L, KA, NamespaceMap<RA["shape"]>>(
          provider,
          args[0] as NamespaceMap<RA["shape"]>
        ),
      };
    }
    return {
      define: makeShellListDefiner<RA, L, KA, NamespaceList<RA["shape"]>>(
        provider,
        args as unknown as NamespaceList<RA["shape"]>
      ),
    };
  }) as unknown as ShellDepsComposer<RA, L, BGL, KA>;

  return {
    deps,
    define: defineTopLevel,
  };
}

// #endregion

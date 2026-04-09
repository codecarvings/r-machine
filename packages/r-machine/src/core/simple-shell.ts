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
import type { AnyResourceAtlas } from "./resource-atlas.js";
import type { NamespaceMap } from "./resource-map.js";
import type { AnyResource } from "./resource-origin.js";
import type { ShellFactory, ShellMapPlug, ShellMapPlugPkg } from "./shell.js";

export type SimpleShellComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = <
  R extends AnyResource,
>(
  factory: (pkg: SimpleShellPlugPkg<RA, L, KA>) => R | Promise<R>
) => { readonly r: ShellFactory<R>; readonly plug: SimpleShellPlug<RA, L, KA> };

type SimpleShellPlug<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = ShellMapPlug<
  RA,
  L,
  KA,
  {}
>;

type SimpleShellPlugPkg<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
> = ShellMapPlugPkg<RA, L, KA, {}>;

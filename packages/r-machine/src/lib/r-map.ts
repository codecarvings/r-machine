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

import type { AnyResourceAtlas, Namespace } from "./resource-atlas.js";

export type NamespaceMap<RA extends AnyResourceAtlas> = {
  readonly [k: string]: Namespace<RA>;
};

export type RMap<RA extends AnyResourceAtlas, NM extends NamespaceMap<RA>> = {
  readonly [K in keyof NM]: RA[NM[K]];
};

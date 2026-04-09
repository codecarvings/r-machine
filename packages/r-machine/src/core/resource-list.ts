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

import type { AnyResourceAtlas, ExtractNamespace, NamespaceRef } from "./resource-atlas.js";
import type { Surface } from "./surface.js";

export type NamespaceList<RA extends AnyResourceAtlas> = readonly NamespaceRef<RA>[];

export type SurfaceList<RA extends AnyResourceAtlas, NL extends NamespaceList<RA>> = {
  readonly [I in keyof NL]: Surface<RA[ExtractNamespace<NL[I]>]>;
};

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

import type { AnyResAtlas, SolidNamespaceRef } from "./res-atlas.js";
import type { ExtractNamespace, NamespaceRef } from "./res-domain.js";
import type { Surface } from "./surface.js";

export type NamespaceList<RA extends AnyResAtlas> = readonly NamespaceRef<RA["shape"]>[];

export type SolidNamespaceList<RA extends AnyResAtlas> = readonly SolidNamespaceRef<RA>[];

// -readonly required to allow tuple spreading
export type SurfaceList<RA extends AnyResAtlas, NL extends NamespaceList<RA>> = {
  -readonly [I in keyof NL]: Surface<
    RA["shape"][ExtractNamespace<NL[I]>],
    ExtractNamespace<NL[I]>,
    RA["let"][ExtractNamespace<NL[I]>]
  >;
};

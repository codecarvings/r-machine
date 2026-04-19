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
import type { AnyResDomain, ExtractNamespace, NamespaceRef } from "./res-domain.js";
import type { Surface } from "./surface.js";

export type NamespaceList<RD extends AnyResDomain> = readonly NamespaceRef<RD>[];

export type SolidNamespaceList<RA extends AnyResAtlas> = readonly SolidNamespaceRef<RA>[];

// -readonly required to allow tuple spreading
export type SurfaceList<RD extends AnyResDomain, NL extends NamespaceList<RD>> = {
  -readonly [I in keyof NL]: Surface<RD[ExtractNamespace<NL[I]>], ExtractNamespace<NL[I]>>;
};

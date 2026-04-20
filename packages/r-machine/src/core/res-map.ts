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

export type NamespaceMap<RA extends AnyResAtlas> = {
  readonly [k: string]: NamespaceRef<RA["shape"]>;
};

export type SolidNamespaceMap<RA extends AnyResAtlas> = {
  readonly [k: string]: SolidNamespaceRef<RA>;
};

// -readonly as SurfaceList
export type SurfaceMap<RA extends AnyResAtlas, NM extends NamespaceMap<RA>> = {
  -readonly [K in keyof NM]: Surface<
    RA["shape"][ExtractNamespace<NM[K]>],
    ExtractNamespace<NM[K]>,
    RA["let"][ExtractNamespace<NM[K]>]
  >;
};

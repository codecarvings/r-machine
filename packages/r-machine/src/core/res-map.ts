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

import type { AnyResDomain, ExtractNamespace, NamespaceRef, SolidNamespaceRef } from "./res-domain.js";
import type { Surface } from "./surface.js";

export type NamespaceMap<RD extends AnyResDomain> = {
  readonly [k: string]: NamespaceRef<RD>;
};

export type SolidNamespaceMap<RD extends AnyResDomain> = {
  readonly [k: string]: SolidNamespaceRef<RD>;
};

// -readonly as SurfaceList
export type SurfaceMap<RD extends AnyResDomain, NM extends NamespaceMap<RD>> = {
  -readonly [K in keyof NM]: Surface<RD[ExtractNamespace<NM[K]>]>;
};

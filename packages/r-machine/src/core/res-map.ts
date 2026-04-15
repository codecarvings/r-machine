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

import type { AnyResAtlas, ExtractNamespace, Namespace, NamespaceRef, SolidNamespaceRef } from "./res-atlas.js";
import type { Surface } from "./surface.js";

// Required for explicit namespace definitions to avoid circular type references
export type ExplicitNamespaceMap<RA extends AnyResAtlas> = {
  readonly [k: string]: Namespace<RA>;
};

export type NamespaceMap<RA extends AnyResAtlas> = {
  readonly [k: string]: NamespaceRef<RA>;
};

export type SolidNamespaceMap<RA extends AnyResAtlas> = {
  readonly [k: string]: SolidNamespaceRef<RA>;
};

export type SurfaceMap<RA extends AnyResAtlas, NM extends NamespaceMap<RA>> = {
  // TODO: WP
  readonly [K in keyof NM]: Surface<RA[ExtractNamespace<NM[K]>]>;
};

export type PartialSurfaceMap<RA extends AnyResAtlas, NM extends NamespaceMap<RA>> = {
  // TODO: WP
  readonly [K in keyof NM]?: Partial<Surface<RA[ExtractNamespace<NM[K]>]>>;
};

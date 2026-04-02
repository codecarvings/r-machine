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

import type { AnyR } from "./r.js";
import type { AnyNamespace, AnyResourceAtlas, Namespace } from "./resource-atlas.js";

export type AnyNamespaceList = readonly AnyNamespace[];

export type AnyRList = readonly AnyR[];

export type NamespaceList<RA extends AnyResourceAtlas> = readonly Namespace<RA>[];

export type RList<RA extends AnyResourceAtlas, NL extends NamespaceList<RA>> = {
  readonly [I in keyof NL]: RA[NL[I]];
};

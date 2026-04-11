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

import type { AnyNamespace, AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./resource-list.js";
import type { NamespaceMap } from "./resource-map.js";

export interface BasePlugDescriptor<
  RA extends AnyResAtlas,
  KA extends NamespaceMap<RA>,
  NS extends NamespaceMap<RA> | NamespaceList<RA>,
> {
  readonly kit: KA;
  readonly namespaces: NS;
  readonly deps: AnyNamespace[];
}

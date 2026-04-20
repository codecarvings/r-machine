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

import type { AnyResAtlas, NamespaceList } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { ResFamily } from "./res.js";
import type { NamespaceMap } from "./res-map.js";

export interface ResWire {
  getPlugin: () => unknown;
}

export type ResWireConnector = (locale: AnyLocale | undefined) => ResWire;

export type ResWireProvider = (
  family: ResFamily,
  namespaces: NamespaceMap<AnyResAtlas> | NamespaceList<AnyResAtlas>
) => ResWireConnector;

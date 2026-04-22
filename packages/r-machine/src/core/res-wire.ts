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

import type { AnyLocale } from "#r-machine/locale";
import type { ResFamily } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export interface ResWire {
  readonly getPlugin: () => unknown;
}

export type ResWireConnector = (locale: AnyLocale | undefined) => ResWire;

export type ResWireProvider = (
  family: ResFamily,
  deps: HandleMap<AnyResAtlas> | HandleList<AnyResAtlas>
) => ResWireConnector;

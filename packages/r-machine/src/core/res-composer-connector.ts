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
import type { KitDepLists } from "./res-equipment.js";
import type { AnyNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";

export type ResComposerConnector = {
  readonly getResWire: (nsDeps: AnyNamespaceMap | AnyNamespaceList, locale: AnyLocale | undefined) => ResWire;
  readonly kitDepLists: KitDepLists;
};

export interface ResWire {
  readonly plugin: unknown;
}

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
import type { GateWire } from "./gate-wire.js";
import type { JunctureManager } from "./juncture-manager.js";
import type { AnyNamespaceCollection } from "./res-domain.js";
import type { VertexGearMap } from "./vertex-gear.js";

export class GateWireManager {
  constructor(protected readonly junctureManager: JunctureManager) {}

  getWire(_nsDeps: AnyNamespaceCollection, _locale: AnyLocale, _vertexGearMap?: VertexGearMap | undefined): GateWire {
    // TODO: Implement this
    return undefined!;
  }
}

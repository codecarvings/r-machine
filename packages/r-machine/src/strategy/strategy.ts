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

import type { AnyResAtlasInstance, RMachine } from "#r-machine";
import type { ResEquipment } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";

export abstract class Strategy<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  E extends ResEquipment<ATLAS["res"], any, any, any, any>,
  C,
> {
  constructor(
    readonly rMachine: RMachine<ATLAS, L, E>,
    readonly config: C
  ) {
    this.validateConfig();
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }
}

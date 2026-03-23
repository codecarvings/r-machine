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

import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";

export abstract class Strategy<RA extends AnyResourceAtlas, L extends AnyLocale, FP extends AnyFmtProvider, C> {
  constructor(
    readonly rMachine: RMachine<RA, L, FP>,
    readonly config: C
  ) {
    this.validateConfig();
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }
}

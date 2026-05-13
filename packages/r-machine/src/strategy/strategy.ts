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

import type { RMachine } from "#r-machine";
import {
  type AnyResAtlas,
  type AnyResEquipment,
  BUS_ACCESSOR,
  type ExperimentalFlags,
  type InternalEventBus,
} from "#r-machine/core";
import type { AnyLocale, LocaleHelper } from "#r-machine/locale";

export interface StrategyHelpers<L extends AnyLocale> {
  readonly localeHelper: LocaleHelper<L>;
}

export abstract class Strategy<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  C,
> {
  protected constructor(
    protected readonly rMachine: RMachine<RA, L, E, EF>,
    protected readonly config: C
  ) {
    this.validateConfig();
  }

  protected _helpers?: unknown;
  getHelpers(): StrategyHelpers<L> {
    if (!this._helpers) {
      this._helpers = {
        localeHelper: this.rMachine.localeHelper,
      };
    }
    return this._helpers as StrategyHelpers<L>;
  }

  protected validateConfig(): void {
    // Default implementation does nothing
  }

  /** @internal */
  [BUS_ACCESSOR](): InternalEventBus {
    return this.rMachine[BUS_ACCESSOR]();
  }
}

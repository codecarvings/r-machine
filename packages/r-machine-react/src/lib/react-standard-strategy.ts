/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { AnyFmtProvider, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { type PartialReactStandardStrategyConfig, ReactStandardStrategyCore } from "#r-machine/react/core";

export class ReactStandardStrategy<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
> extends ReactStandardStrategyCore<RA, L, FP> {
  constructor(rMachine: RMachine<RA, L, FP>);
  constructor(rMachine: RMachine<RA, L, FP>, config: PartialReactStandardStrategyConfig);
  constructor(rMachine: RMachine<RA, L, FP>, config: PartialReactStandardStrategyConfig = {}) {
    super(rMachine, {
      ...ReactStandardStrategyCore.defaultConfig,
      ...config,
    });
  }
}

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

import type { AnyFmtProvider, AnyResourceAtlas } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { Strategy } from "r-machine/strategy";
import { createReactBareToolset, type ReactBareToolset } from "./react-bare-toolset.js";

export class ReactBareStrategy<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  FP extends AnyFmtProvider,
> extends Strategy<RA, L, FP, undefined> {
  createToolset(): Promise<ReactBareToolset<RA, L, FP>> {
    return createReactBareToolset(this.rMachine);
  }
}

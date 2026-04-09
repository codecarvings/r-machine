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

import type { Kit } from "#r-machine";
import type { AnyResourceAtlas } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { ConnectedComposer } from "./connected-composer.js";
import type { GearMapComposer } from "./gear.js";
import type { ReactiveComposer } from "./reactive-composer.js";
import type { ShellMapComposer } from "./shell.js";

export interface RComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends Kit<RA>> {
  readonly connected: ConnectedComposer<RA, L, KA>;
  readonly reactive: ReactiveComposer<RA, KA>;

  readonly gear: GearMapComposer<RA, KA["gear"], {}>;
  readonly vertexGear: GearMapComposer<RA, KA["gear"], {}>;
  readonly shell: ShellMapComposer<RA, L, KA["shell"], {}>;
}

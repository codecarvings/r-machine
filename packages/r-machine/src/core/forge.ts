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
import { type ConnectedComposer, createConnectedComposer } from "./connected-composer.js";
import type { GearMapComposer } from "./gear.js";
import { createGearMapComposer } from "./gear-composer.js";
import { createReactiveComposer, type ReactiveComposer } from "./reactive-composer.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResKit } from "./res-kit.js";
import type { ResWireProvider } from "./res-wire.js";
import type { ShellMapComposer } from "./shell.js";
import { createShellMapComposer } from "./shell-composer.js";
import type { VertexGearTag } from "./vertex-gear.js";

export interface Forge<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>> {
  readonly connected: ConnectedComposer<RA, L, KA>;
  readonly reactive: ReactiveComposer<RA, KA>;

  readonly gear: GearMapComposer<RA, KA["gear"], {}>;
  readonly vertexGear: GearMapComposer<RA, KA["gear"], {}, VertexGearTag>;
  readonly shell: ShellMapComposer<RA, L, KA["shell"], {}>;
}

export function createForge<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>>(
  resWireProvider: ResWireProvider
): Forge<RA, L, KA> {
  return {
    connected: createConnectedComposer<RA, L, KA>(resWireProvider),
    reactive: createReactiveComposer<RA, KA>(resWireProvider),
    gear: createGearMapComposer<RA, KA["gear"], {}>(resWireProvider, {}, false),
    vertexGear: createGearMapComposer<RA, KA["gear"], {}, VertexGearTag>(resWireProvider, {}, true),
    shell: createShellMapComposer<RA, L, KA["shell"], {}>(resWireProvider, {}),
  };
}

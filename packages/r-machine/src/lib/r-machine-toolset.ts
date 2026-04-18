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

import type { GearComposer, Namespace, ResSet, ShellComposer, VertexGearTag } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyResAtlasInstance } from "./resource-atlas.js";

// K bundles kits + bridgeGears (see ResSet). Composers will read from
// K["bridgeGears"] in step 5 to expose bridge surfaces in the shell plugin
// context.
export interface RMachineToolset<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  K extends ResSet<ATLAS["res"], any, any, any, any>,
> {
  readonly Gear: GearComposer<ATLAS["res"], K["gear"]>;
  readonly VertexGear: GearComposer<ATLAS["res"], K["gear"], VertexGearTag>;
  readonly Shell: ShellComposer<ATLAS["res"], L, K["shell"]>;
  readonly localized: LocalizerHelper<ATLAS>;
}

type LocalizerHelper<ATLAS extends AnyResAtlasInstance> = <
  N extends Namespace<ATLAS["res"]>,
  const R extends ATLAS["res"][N],
>(
  namespace: N,
  shell: R & Record<Exclude<keyof R, keyof ATLAS["res"][N]>, never>
) => R;

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

import type { GearComposer, Namespace, ResKit, ShellComposer, VertexGearTag } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyResAtlasInstance, BridgeGearNamespace } from "./resource-atlas.js";

// BG carries the bridgeGears tuple — consumed by the Shell composer in
// step 5 to expose bridge surfaces in the shell plugin context. Defaults
// to empty tuple so existing call sites without bridgeGears still work.
export interface RMachineToolset<
  ATLAS extends AnyResAtlasInstance,
  L extends AnyLocale,
  KA extends ResKit<ATLAS["res"]>,
  BG extends readonly BridgeGearNamespace<ATLAS>[] = readonly [],
> {
  readonly Gear: GearComposer<ATLAS["res"], KA["gear"]>;
  readonly VertexGear: GearComposer<ATLAS["res"], KA["gear"], VertexGearTag>;
  readonly Shell: ShellComposer<ATLAS["res"], L, KA["shell"]>;
  readonly localized: LocalizerHelper<ATLAS>;
  // Phantom: BG is used for step-5 bridge surface typing. Kept as a reserved
  // generic to avoid signature churn when the composers start consuming it.
  readonly __bridgeGears?: BG;
}

type LocalizerHelper<ATLAS extends AnyResAtlasInstance> = <
  N extends Namespace<ATLAS["res"]>,
  const R extends ATLAS["res"][N],
>(
  namespace: N,
  shell: R & Record<Exclude<keyof R, keyof ATLAS["res"][N]>, never>
) => R;

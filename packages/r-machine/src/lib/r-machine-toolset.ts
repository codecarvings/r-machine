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

import type { AnyResAtlas, GearComposer, Namespace, ResKit, ShellComposer } from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";

export interface RMachineToolset<RA extends AnyResAtlas, L extends AnyLocale, KA extends ResKit<RA>> {
  readonly Gear: GearComposer<RA, KA["gear"]>;
  readonly Shell: ShellComposer<RA, L, KA["shell"]>;
  readonly localized: LocalizerHelper<RA>;
}

type LocalizerHelper<RA extends AnyResAtlas> = <N extends Namespace<RA>, const R extends RA[N]>(
  namespace: N,
  shell: R & Record<Exclude<keyof R, keyof RA[N]>, never>
) => R;

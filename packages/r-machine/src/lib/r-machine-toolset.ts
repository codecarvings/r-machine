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

import type {
  AnyResAtlas,
  AnyResDomain,
  AnyResEquipment,
  ExperimentalFlags,
  HubGearComposer,
  InnerGearComposer,
  Namespace,
  OuterGearComposer,
  ShellComposer,
} from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";

export type RMachineToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
> = {
  readonly InnerGear: InnerGearComposer<RA, E["gearKit"]>;
  readonly HubGear: HubGearComposer<RA, E["gearKit"]>;
  readonly Shell: ShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>;
  readonly localized: LocalizerHelper<RA["shape@shell"]>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly OuterGear: OuterGearComposer<RA, E["gearKit"]>;
    }
  : {});

type LocalizerHelper<RD extends AnyResDomain> = <N extends Namespace<RD>, const R extends RD[N]>(
  namespace: N,
  shell: R & Record<Exclude<keyof R, keyof RD[N]>, never>
) => R;

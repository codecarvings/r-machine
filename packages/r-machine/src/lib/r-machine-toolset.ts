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
  AnyNamespace,
  AnyRes,
  AnyResAtlas,
  AnyResDomain,
  AnyResEquipment,
  BaseGearComposer,
  DirectPlugDefiner,
  ExperimentalFlags,
  InnerGearComposer,
  Namespace,
  OuterGearComposer,
  ShellComposer,
  ShellResolverBuilder,
} from "#r-machine/core";
import type { AnyLocale } from "#r-machine/locale";

export type RMachineToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
> = {
  readonly InnerGear: InnerGearComposer<RA, E["gearKit"]>;
  readonly BaseGear: BaseGearComposer<RA, E["gearKit"]>;
  readonly Shell: ShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>;
  readonly DirectPlug: DirectPlugDefiner<RA, L, E["directKit"]>;
  readonly localized: LocalizerHelper<RA["shape@shell"]>;
  // Groups the "derived dependency" builders — used INSIDE `withDeps` to declare
  // a dependency whose resolved value is a transformed view of the resource
  // rather than the plain surface. Lives on the toolset (authoring layer,
  // alongside the composers). One member today; future adapters (e.g. `lazy`,
  // `optional`) join here without proliferating top-level toolset helpers.
  readonly res: ResDepBuilders<RA, L>;
} & (EF["outerGear"] extends "on"
  ? {
      readonly OuterGear: OuterGearComposer<RA, E["gearKit"]>;
    }
  : {});

// Derived-dependency builders exposed as `toolset.res`.
//  - `perLocale(shell)`: declares a locale-keyed shell as a gear/shell dependency;
//    the resolved value is a loader `(locale: L) => Promise<Surface>` typed to the
//    atlas's configured locales `L` (the locale arrives at runtime). Restricted to
//    the shell catalog via `ShellResolverBuilder`.
type ResDepBuilders<RA extends AnyResAtlas, L extends AnyLocale> = {
  readonly perLocale: ShellResolverBuilder<RA["shape@shell"], L>;
};

type LocalizerHelper<RD extends AnyResDomain> = <N extends Namespace<RD>, const R extends RD[N]>(
  namespace: N,
  shell: R & Record<Exclude<keyof R, keyof RD[N]>, never>
) => R;

export function localized<S extends AnyRes>(_namespace: AnyNamespace, shell: S): S {
  return shell;
}

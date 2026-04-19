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

import type { AnyResLayout, ResAtlasClass, ResolveLayoutType } from "#r-machine/core";
import type { RMachineTypeError } from "#r-machine/errors";

type FilterResAtlasKeys<RL extends AnyResLayout, RA> = {
  readonly [K in keyof RA as K extends string
    ? K extends `${string}/${string}`
      ? [ResolveLayoutType<RL, K>] extends [never]
        ? never
        : K
      : never
    : never]: RA[K];
};

type ValidLayoutKeys<RL> = {
  readonly [K in keyof RL]: K extends `${string}/`
    ? RL[K]
    : RMachineTypeError<`Layout key '${K & string}' must end with '/' to indicate a namespace prefix (e.g. 'gear/').`>;
};

type ResAtlasBuilder<RL extends AnyResLayout> = <const RA>() => ResAtlasClass<RL, FilterResAtlasKeys<RL, RA>, RA>;

export function defineLayout<const RL extends AnyResLayout>(layout: RL & ValidLayoutKeys<RL>): ResAtlasBuilder<RL> {
  function builder<const RA>(): ResAtlasClass<RL, FilterResAtlasKeys<RL, RA>, RA> {
    // biome-ignore lint/complexity/noStaticOnlyClass: As per design
    abstract class ResourceAtlas {
      static readonly layout = layout;
    }
    return ResourceAtlas as unknown as ResAtlasClass<RL, FilterResAtlasKeys<RL, RA>, RA>;
  }
  return builder;
}

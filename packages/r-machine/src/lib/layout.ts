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

type ValidResAtlasShape<LO extends AnyResLayout, A> = {
  readonly [K in keyof A]: K extends `${string}/${string}`
    ? [ResolveLayoutType<LO, K & string>] extends [never]
      ? RMachineTypeError<`Namespace '${K & string}' has no matching prefix in the layout. Declare a prefix in defineLayout({...}) first.`>
      : unknown
    : RMachineTypeError<`Namespace '${K & string}' must be a sub-path (e.g. 'gear/foo'), not a bare top-level key.`>;
};

type ResAtlasBuilder<RL extends AnyResLayout> = RL &
  (<const A extends ValidResAtlasShape<RL, A>>() => ResAtlasClass<RL, A>);

export function defineLayout<const LO extends AnyResLayout>(layout: LO): ResAtlasBuilder<LO> {
  function builder<const RA extends ValidResAtlasShape<LO, RA>>(): ResAtlasClass<LO, RA> {
    // biome-ignore lint/complexity/noStaticOnlyClass: As per design
    abstract class ResourceAtlas {
      static readonly layout: LO = layout;
    }
    return ResourceAtlas as unknown as ResAtlasClass<LO, RA>;
  }
  return Object.assign(builder, layout) as ResAtlasBuilder<LO>;
}

export const defaultLayout = defineLayout({
  gear: "gear",
  "gear/vertex": "vertex-gear",
  shell: "shell",
  "shell/lib": "dynamic-shell",
});

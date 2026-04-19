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

type ValidResAtlasShape<RL extends AnyResLayout, A> = {
  readonly [K in keyof A]: K extends `${string}/${string}`
    ? [ResolveLayoutType<RL, K & string>] extends [never]
      ? RMachineTypeError<`Namespace '${K & string}' has no matching prefix in the layout. Declare a prefix in defineLayout({...}) first.`>
      : unknown
    : RMachineTypeError<`Namespace '${K & string}' must be a sub-path (e.g. 'gear/foo').`>;
};

// Validates that every key of an inferred layout literal ends with "/". The
// index signature on AnyResLayout alone is not enough: TypeScript does not
// reject extra keys whose names violate a template-literal index-key pattern
// when the type is inferred from a `const` generic object literal. This
// mapped type closes that gap by mapping each non-slash-terminated key to a
// branded error value that is not assignable from any ResLayoutEntryType.
type ValidLayoutKeys<RL> = {
  readonly [K in keyof RL]: K extends `${string}/`
    ? RL[K]
    : RMachineTypeError<`Layout key '${K & string}' must end with '/' to indicate a namespace prefix (e.g. 'gear/').`>;
};

type ResAtlasBuilder<RL extends AnyResLayout> = <const RA extends ValidResAtlasShape<RL, RA>>() => ResAtlasClass<
  RL,
  RA
>;

export function defineLayout<const RL extends AnyResLayout>(layout: RL & ValidLayoutKeys<RL>): ResAtlasBuilder<RL> {
  function builder<const RA extends ValidResAtlasShape<RL, RA>>(): ResAtlasClass<RL, RA> {
    // biome-ignore lint/complexity/noStaticOnlyClass: As per design
    abstract class ResourceAtlas {
      static readonly layout = layout;
    }
    return ResourceAtlas as unknown as ResAtlasClass<RL, RA>;
  }
  return builder;
}

export const defaultLayout = defineLayout({
  "gear/": "gear", // <-- Folder containing gear resources.
  "gear/vertex/": "vertex-gear", // <-- Folder containing vertex-gear resources (components).
  "shell/": "shell", // <-- Folder containing multi-file shell resources.
  "shell/lib/": "dynamic-shell", // <-- Folder containing single-file shell resources.
});

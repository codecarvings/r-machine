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

import { type AnyResDomain, type AnyResLayout, createToken, type ResAtlasClass } from "#r-machine/core";
import type { RMachineTypeError } from "#r-machine/errors";

// Drops atlas keys whose namespace does not match any prefix declared in the
// layout. The shape of this type is load-bearing for circularity behavior —
// please do not "simplify" it without understanding the trade-off.
//
// Naive shape: { [K in keyof RD as IsValid<K> ? K : never]: RD[K] } — this
// walks every key of RD and accesses RD[K] for each, which forces TS to
// materialize the value types. When a gear self-references its own namespace
// (a runtime-only error invisible to the type system), that walk triggers
// TS2615 "circularly references itself in mapped type" and cascades onto
// every consumer.
//
// The shape below avoids the walk in the common case (all keys valid) by
// short-circuiting on a single subset check between two unions:
//   Extract<keyof RD, string> extends `${prefix}${string}`
// which TS evaluates lazily without instantiating property types. When the
// check passes, RD is returned opaque — no mapped type, no per-key value
// resolution, no TS2615. Only when the check fails (genuinely invalid keys)
// do we fall back to Omit, which does walk RD but is acceptable because that
// path runs in a non-circular scenario.
//
// Net effect: silent-drop semantics preserved for invalid layout keys, while
// self-circular gears no longer cascade through this type.
export type FilterResAtlasKeys<RL extends AnyResLayout, RD> = RD extends AnyResDomain
  ? Extract<keyof RD, string> extends `${ValidLayoutPrefix<RL>}${string}`
    ? RD
    : Omit<RD, Exclude<keyof RD, `${ValidLayoutPrefix<RL>}${string}`>>
  : never;

type ValidLayoutPrefix<RL extends AnyResLayout> = Extract<keyof RL, `${string}/`>;

type ValidLayoutKeys<RL> = {
  readonly [K in keyof RL]: K extends `${string}/`
    ? RL[K]
    : RMachineTypeError<`Layout key '${K & string}' must end with '/' to indicate a namespace prefix (e.g. 'gear/').`>;
};

type ResAtlasBuilder<RL extends AnyResLayout> = <const RD>() => ResAtlasClass<RL, FilterResAtlasKeys<RL, RD>, RD>;

export function defineLayout<RL extends AnyResLayout>(layout: RL & ValidLayoutKeys<RL>): ResAtlasBuilder<RL> {
  function builder<const RD>(): ResAtlasClass<RL, FilterResAtlasKeys<RL, RD>, RD> {
    // biome-ignore lint/complexity/noStaticOnlyClass: As per design
    abstract class ResourceAtlas {
      static readonly layout = layout;
      static getTokenBuilder() {
        return createToken;
      }
    }
    return ResourceAtlas as ResAtlasClass<RL, FilterResAtlasKeys<RL, RD>, RD>;
  }
  return builder;
}

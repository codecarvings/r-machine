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

import type { RMachineTypeError } from "#r-machine/errors";
import type { AnyResAtlas, ResAtlasCatalog, SolidHandle } from "./res-atlas.js";
import { type ExtractNamespace, getNamespace, type Handle, type Namespace } from "./res-domain.js";
import type { Surface } from "./surface.js";

export type HandleMap<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = {
  readonly [k: string]: Handle<RA[C]>;
};

export type SolidHandleMap<RA extends AnyResAtlas> = {
  readonly [k: string]: SolidHandle<RA>;
};

export type NamespaceMap<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = {
  readonly [k: string]: Namespace<RA[C]>;
};
export type AnyNamespaceMap = NamespaceMap<AnyResAtlas>;

// Utility type to check if a HandleMap is widened (wrong namespace is passed)
export type IsWidenedMap<M> = string extends keyof M ? true : false;

export type ValidatedDepMapType<DM, T> =
  IsWidenedMap<DM> extends true ? RMachineTypeError<"Invalid dependency map provided."> : T;

export function getNamespaceMap<RA extends AnyResAtlas>(handles: HandleMap<RA>): NamespaceMap<RA> {
  const result: any = {};
  for (const k in handles) {
    result[k] = getNamespace(handles[k]);
  }
  return result as NamespaceMap<RA>;
}

// -readonly as SurfaceList
export type SurfaceMap<RA extends AnyResAtlas, HM extends HandleMap<RA>> = {
  -readonly [K in keyof HM]: Surface<
    RA["shape"][ExtractNamespace<HM[K]>],
    ExtractNamespace<HM[K]>,
    RA["let"][ExtractNamespace<HM[K]>]
  >;
};

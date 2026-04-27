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
import {
  type AnyNamespaceCollection,
  type ExtractNamespace,
  getNamespace,
  type Handle,
  type Namespace,
} from "./res-domain.js";
import type { Surface } from "./surface.js";

export type HandleList<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = readonly Handle<RA[C]>[];

export type SolidHandleList<RA extends AnyResAtlas> = readonly SolidHandle<RA>[];

export type NamespaceList<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> = readonly Namespace<RA[C]>[];

export function getNamespaceList<RA extends AnyResAtlas>(handles: HandleList<RA>): NamespaceList<RA> {
  return handles.map(getNamespace) as NamespaceList<RA>;
}
export type AnyNamespaceList = NamespaceList<AnyResAtlas>;

// Utility type to check if a HandleList is widened (wrong namespace is passed)
export type IsWidenedList<L extends readonly unknown[]> = number extends L["length"] ? true : false;

export type ValidatedDepListType<DL extends readonly unknown[], T> =
  IsWidenedList<DL> extends true ? RMachineTypeError<"Invalid dependency list provided."> : T;

export function isNamespaceList(value: AnyNamespaceCollection): value is AnyNamespaceList {
  return Array.isArray(value);
}

// -readonly required to allow tuple spreading
export type SurfaceList<RA extends AnyResAtlas, HL extends HandleList<RA>> = {
  -readonly [I in keyof HL]: Surface<
    RA["shape"][ExtractNamespace<HL[I]>],
    ExtractNamespace<HL[I]>,
    RA["let"][ExtractNamespace<HL[I]>]
  >;
};

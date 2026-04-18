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

import type { ShellTag } from "#r-machine/core";
import type { GearTag } from "./gear.js";
import type { ReactiveGearTag } from "./reactive-gear.js";
import type { VertexGearTag } from "./vertex-gear.js";

export type AnyNamespace = string;

export interface AnyResAtlas {
  readonly [namespace: AnyNamespace]: any; // Do not use AnyRes - It breaks token system
}

export type Namespace<RA extends AnyResAtlas> = Extract<keyof RA, AnyNamespace>;

export type GearNamespace<RA extends AnyResAtlas> = {
  [K in Namespace<RA>]: RA[K] extends GearTag | ReactiveGearTag ? (RA[K] extends VertexGearTag ? never : K) : never;
}[Namespace<RA>];

export type ShellNamespace<RA extends AnyResAtlas> = {
  [K in Namespace<RA>]: RA[K] extends ShellTag ? K : never;
}[Namespace<RA>];

export type SolidNamespace<RA extends AnyResAtlas> = {
  [K in Namespace<RA>]: RA[K] extends ReactiveGearTag | VertexGearTag ? never : K;
}[Namespace<RA>];

const namespaceSymbol = Symbol("namespace");
export interface Token<N extends string> {
  readonly [namespaceSymbol]: N;
}

export type NamespaceRef<RA extends AnyResAtlas> = Namespace<RA> | Token<Namespace<RA>>;
export type GearNamespaceRef<RA extends AnyResAtlas> = GearNamespace<RA> | Token<GearNamespace<RA>>;
export type ShellNamespaceRef<RA extends AnyResAtlas> = ShellNamespace<RA> | Token<ShellNamespace<RA>>;
export type SolidNamespaceRef<RA extends AnyResAtlas> = SolidNamespace<RA> | Token<SolidNamespace<RA>>;

export type ExtractNamespace<T extends NamespaceRef<any>> = T extends Token<infer N> ? N : T;

export function getNamespace<T extends NamespaceRef<any>>(tokenOrNamespace: T): ExtractNamespace<T> {
  if (typeof tokenOrNamespace === "string") {
    return tokenOrNamespace as ExtractNamespace<T>;
  } else {
    return tokenOrNamespace[namespaceSymbol] as ExtractNamespace<T>;
  }
}

export function isNamespace<T extends NamespaceRef<any>>(value: T): boolean {
  return typeof value === "string" || (value && typeof value === "object" && namespaceSymbol in value);
}

export function createToken<N extends AnyNamespace>(namespace: N): Token<N> {
  return { [namespaceSymbol]: namespace };
}

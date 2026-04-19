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

import type { ReactiveGearTag } from "./reactive-gear.js";

export type AnyNamespace = string;

export interface AnyResDomain {
  readonly [namespace: AnyNamespace]: any; // Do not use AnyRes - It breaks token system
}

export type Namespace<RD extends AnyResDomain> = Extract<keyof RD, AnyNamespace>;

export type SolidNamespace<RD extends AnyResDomain> = {
  [K in Namespace<RD>]: RD[K] extends ReactiveGearTag | VertexGearTag ? never : K;
}[Namespace<RD>];

const namespaceSymbol = Symbol("namespace");
export interface Token<N extends string> {
  readonly [namespaceSymbol]: N;
}

export type TokenBuilder<RD extends AnyResDomain> = <N extends Namespace<RD>>(namespace: N) => Token<N>;

export type NamespaceRef<RD extends AnyResDomain> = Namespace<RD> | Token<Namespace<RD>>;
export type SolidNamespaceRef<RD extends AnyResDomain> = SolidNamespace<RD> | Token<SolidNamespace<RD>>;

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

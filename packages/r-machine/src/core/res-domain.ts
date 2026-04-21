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

import type { ResLayoutEntryType } from "./index.js";

export type AnyNamespace = string;

export interface AnyResDomain {
  // `any` is intentional here: replacing it with `AnyRes` introduces a circular
  // dependency AnyResDomain ↔ Token<Namespace<RD>> ↔ AnyRes that breaks
  // Token inference and, in turn, the whole token system.
  readonly [namespace: AnyNamespace]: any;
}
export interface AnyResDomainLayout {
  readonly [namespace: AnyNamespace]: ResLayoutEntryType;
}

export type Namespace<RD extends AnyResDomain> = Extract<keyof RD, AnyNamespace>;

const namespaceSymbol = Symbol("namespace");
export interface Token<N extends string> {
  readonly [namespaceSymbol]: N;
}

export type TokenBuilder<RD extends AnyResDomain> = <N extends Namespace<RD>>(namespace: N) => Token<N>;

export type NamespaceRef<RD extends AnyResDomain> = Namespace<RD> | Token<Namespace<RD>>;

export type ExtractNamespace<T extends NamespaceRef<any>> = T extends Token<infer N> ? N : T;

export function getNamespace<T extends NamespaceRef<any>>(tokenOrNamespace: T): ExtractNamespace<T> {
  if (typeof tokenOrNamespace === "string") {
    return tokenOrNamespace as ExtractNamespace<T>;
  } else {
    return tokenOrNamespace[namespaceSymbol] as ExtractNamespace<T>;
  }
}

export function isNamespace(value: unknown): value is NamespaceRef<any> {
  return typeof value === "string" || (typeof value === "object" && value !== null && namespaceSymbol in value);
}

export function createToken<N extends AnyNamespace>(namespace: N): Token<N> {
  return { [namespaceSymbol]: namespace };
}

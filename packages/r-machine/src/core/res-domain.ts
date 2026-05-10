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

import type { ResLayoutEntryType } from "./res-layout.js";
import type { AnyNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";

export type AnyNamespace = string;
export type NamespaceParts = readonly [prefix: string, suffix: string];

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

export type Handle<RD extends AnyResDomain> = Namespace<RD> | Token<Namespace<RD>>;

export type ExtractNamespace<H extends Handle<any>> = H extends Token<infer N> ? N : H;

export type AnyNamespaceCollection = AnyNamespaceMap | AnyNamespaceList;

export function getNamespace<H extends Handle<any>>(handle: H): ExtractNamespace<H> {
  if (typeof handle === "string") {
    return handle as ExtractNamespace<H>;
  } else {
    return handle[namespaceSymbol] as ExtractNamespace<H>;
  }
}

export function isHandle(value: unknown): value is Handle<any> {
  return typeof value === "string" || (typeof value === "object" && value !== null && namespaceSymbol in value);
}

export function createToken<N extends AnyNamespace>(namespace: N): Token<N> {
  return { [namespaceSymbol]: namespace };
}

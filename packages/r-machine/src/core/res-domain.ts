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

import type { AnyLocale } from "#r-machine/locale";
import type { ResLayoutEntryType } from "./res-layout.js";
import type { AnyNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap } from "./res-map.js";

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

// Unambiguous cache key for (namespace, locale) pairs.
//
// Encoding: `<locale><SEP><namespace>`, where SEP = U+001F (Unit Separator).
// An empty locale prefix means `undefined`. Decoding is unambiguous (split at
// the first SEP) iff:
//   1. `AnyLocale` values never contain U+001F — enforced by
//      validateCanonicalUnicodeLocaleId (BCP-47 allows only [a-zA-Z0-9-]).
//   2. `AnyLocale` values are never the empty string — enforced by the same
//      validator and by LocaleHelper.validateLocale at boundaries.
// Both invariants are guaranteed transitively for any locale reaching this
// helper; the namespace is therefore free to contain any character, including
// U+001F, without causing collisions.
export function getResCacheKey(
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  esLayoutEntryType: ResLayoutEntryType
): string {
  if (esLayoutEntryType === "shell") {
    return `${locale}\x1f${namespace}`;
  }

  return namespace;
}

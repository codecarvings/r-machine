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
import type { AnyResAtlas, ResAtlasCatalog } from "./res-atlas.js";
import type { ResLayoutEntryType } from "./res-layout.js";
import type { AnyNamespaceList, NamespaceList } from "./res-list.js";
import type { AnyNamespaceMap, NamespaceMap } from "./res-map.js";

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

// A `ShellResolverHandle<N, L>` marks a dependency whose RESOLVED value is a
// locale-parametric loader `(locale: L) => Promise<Surface>` rather than a plain
// Surface — used to declare a locale-keyed shell as a dependency of a
// locale-agnostic gear (the locale arrives at runtime). It is structurally a
// `Token<N>` (carries the same `[namespaceSymbol]: N`, so `ExtractNamespace`
// keeps working unchanged) plus a private `[shellResolverSymbol]` brand. Both symbols
// are module-private, so a ShellResolverHandle cannot be forged outside `createShellResolver()`.
// `L` is a TYPE-ONLY phantom carrying the atlas's configured locale union (so the
// loader's `locale` param is typed, not `AnyLocale`); it is absent at runtime.
const shellResolverSymbol = Symbol("shellResolver");
declare const shellResolverLocale: unique symbol;
export interface ShellResolverHandle<N extends string, L extends AnyLocale = AnyLocale> extends Token<N> {
  readonly [shellResolverSymbol]: true;
  readonly [shellResolverLocale]?: L;
}

// True when a handle is a shell resolver (drives the dep→surface conditional in
// DepSurfaceMap/DepSurfaceList).
export type IsShellResolver<H> = H extends { readonly [shellResolverSymbol]: true } ? true : false;

// A resolved `res.perLocale(...)` dependency: a loader that returns the shell
// surface for the locale passed at call time. `S = any` on purpose — the surface
// type is inferred from each loader at the batch-helper call site.
export type LocaleLoader<L extends AnyLocale, S = any> = (locale: L) => Promise<S>;
type LoaderMap<L extends AnyLocale> = Record<string, LocaleLoader<L>>;
// Maps a loader map (or loader tuple — a mapped tuple stays a tuple) to the
// record/tuple of its resolved surfaces. The `infer S` on the loader's Promise
// keeps `X[K]` from needing a function constraint (which a tuple's array members
// would break).
type Loaded<X> = { [K in keyof X]: X[K] extends (locale: any) => Promise<infer S> ? S : never };

// `res.perLocale`: a builder AND a pair of resolution-time batch helpers.
//   - CALL form — `res.perLocale("shell/x")` — declares the dep (returns a handle,
//     symmetry with `withDeps`: accepts a shell namespace string OR a shell token).
//     `L` (the configured locale union) is fixed by the toolset exposing the builder
//     and stamped onto the handle, so the resolved loader's locale is typed.
//   - `pickAll(...)` — resolve loader(s) for EVERY configured locale, locale-major
//     (`Record<L, …>`); a bare loader yields `Record<L, S>`, a map yields
//     `Record<L, { …resolved }>`.
//   - `pick(locale, …)` — resolve a batch at ONE locale, preserving shape (map→map,
//     tuple→tuple).
// Overload order matters: the single-loader / tuple forms come first (a tuple fails
// the `LoaderMap` constraint via `length`/array methods, and a function is not a
// record, so the map overloads never mis-capture them).
export interface ShellResolverBuilder<RD extends AnyResDomain, L extends AnyLocale = AnyLocale> {
  <N extends Namespace<RD>>(nsOrToken: N | Token<N>): ShellResolverHandle<N, L>;
  pickAll<S>(loader: LocaleLoader<L, S>): Promise<Record<L, S>>;
  pickAll<M extends LoaderMap<L>>(loaders: M): Promise<Record<L, Loaded<M>>>;
  pick<T extends readonly LocaleLoader<L>[]>(locale: L, loaders: readonly [...T]): Promise<Loaded<T>>;
  pick<M extends LoaderMap<L>>(locale: L, loaders: M): Promise<Loaded<M>>;
}

export type NamespaceCollection<RA extends AnyResAtlas, C extends ResAtlasCatalog = "shape"> =
  | NamespaceMap<RA, C>
  | NamespaceList<RA, C>;

export type AnyNamespaceCollection = AnyNamespaceMap | AnyNamespaceList;

// A leading `#` marks a namespace as internal (consumer-hidden) at the type
// level. At runtime the marker is invisible: this single normalization at the
// canonical extraction point ensures registry keys, loader paths, res
// chains and caches all use bare namespaces, regardless of whether the user
// wrote "#base/jwt" or "base/jwt".
function stripInternalMarker(namespace: string): string {
  return namespace.charCodeAt(0) === 0x23 /* '#' */ ? namespace.slice(1) : namespace;
}

export function getNamespace<H extends Handle<any>>(handle: H): ExtractNamespace<H> {
  if (typeof handle === "string") {
    return stripInternalMarker(handle) as ExtractNamespace<H>;
  } else {
    return stripInternalMarker(handle[namespaceSymbol]) as ExtractNamespace<H>;
  }
}

export function isHandle(value: unknown): value is Handle<any> {
  return typeof value === "string" || (typeof value === "object" && value !== null && namespaceSymbol in value);
}

export function isShellResolver(value: unknown): value is ShellResolverHandle<AnyNamespace> {
  return typeof value === "object" && value !== null && shellResolverSymbol in value;
}

export function createToken<N extends AnyNamespace>(namespace: N): Token<N> {
  return { [namespaceSymbol]: namespace };
}

// Build a shell resolver handle from a shell namespace string or token. Reuses
// `getNamespace` for extraction (token → symbol, string → itself; strips the
// internal marker), so the stored namespace is always bare.
export function createShellResolver<N extends AnyNamespace>(nsOrToken: N | Token<N>): ShellResolverHandle<N> {
  const namespace = getNamespace(nsOrToken as Handle<any>) as N;
  return { [namespaceSymbol]: namespace, [shellResolverSymbol]: true };
}

// Build the toolset's `res.perLocale` member: the `createShellResolver` builder with
// the resolution-time batch helpers `pickAll` / `pick` attached, closing over the
// machine's configured `locales` (so a factory never has to enumerate them itself).
// The helpers operate on ALREADY-RESOLVED loaders `(locale) => Promise<Surface>`;
// locale validation lives in the loader, so it is not repeated here.
export function createPerLocale<RD extends AnyResDomain, L extends AnyLocale>(
  locales: readonly L[]
): ShellResolverBuilder<RD, L> {
  const perLocale = ((nsOrToken: AnyNamespace | Token<AnyNamespace>) =>
    createShellResolver(nsOrToken)) as ShellResolverBuilder<RD, L>;

  perLocale.pickAll = (async (x: LocaleLoader<L> | LoaderMap<L>) => {
    if (typeof x === "function") {
      const entries = await Promise.all(locales.map(async (l) => [l, await x(l)] as const));
      return Object.fromEntries(entries);
    }
    const keys = Object.keys(x);
    const entries = await Promise.all(
      locales.map(async (l) => {
        const bundle = await Promise.all(keys.map(async (k) => [k, await x[k]!(l)] as const));
        return [l, Object.fromEntries(bundle)] as const;
      })
    );
    return Object.fromEntries(entries);
  }) as ShellResolverBuilder<RD, L>["pickAll"];

  perLocale.pick = (async (locale: L, x: readonly LocaleLoader<L>[] | LoaderMap<L>) => {
    if (Array.isArray(x)) {
      return Promise.all(x.map((fn) => fn(locale)));
    }
    const map = x as LoaderMap<L>;
    const bundle = await Promise.all(Object.keys(map).map(async (k) => [k, await map[k]!(locale)] as const));
    return Object.fromEntries(bundle);
  }) as ShellResolverBuilder<RD, L>["pick"];

  return perLocale;
}

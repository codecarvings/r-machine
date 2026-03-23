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

// --- Fmt ---
export type AnyFmt = object;

export type FmtGetter<L extends AnyLocale, F extends AnyFmt> = (locale: L) => F;
export type AnyFmtGetter = FmtGetter<AnyLocale, AnyFmt>;

// --- Provider ---
export interface FmtProvider<L extends AnyLocale, F extends AnyFmt> {
  readonly get: FmtGetter<L, F>;
}
export type AnyFmtProvider = FmtProvider<any, any>;

// --- Provider Ctor ---
export interface FmtProviderCtor<FP extends AnyFmtProvider> {
  new (): FP;
  readonly get: FP["get"];
}

export type AnyFmtProviderCtor = FmtProviderCtor<AnyFmtProvider>;
export type ExtractFmt<FP extends AnyFmtProvider> = FP extends FmtProvider<any, infer F> ? F : never;

// --- Empty ---
export type EmptyFmt = {};
export type EmptyFmtProvider = FmtProvider<AnyLocale, EmptyFmt>;

const EMPTY_FMT: EmptyFmt = Object.freeze({} as EmptyFmt);
export const EmptyFmtProviderCtor = class {
  readonly get = () => EMPTY_FMT;
  static get = () => EMPTY_FMT;
} as FmtProviderCtor<EmptyFmtProvider>;

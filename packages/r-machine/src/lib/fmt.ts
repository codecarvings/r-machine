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

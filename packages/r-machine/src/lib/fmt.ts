import type { AnyLocale } from "#r-machine/locale";

// --- Fmt ---
export type AnyFmt = object;

export type FmtGetter<L extends AnyLocale, F extends AnyFmt> = (locale: L) => F;
type FmtFactory<L extends AnyLocale, F extends AnyFmt> = FmtGetter<L, F>;
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

// --- Seed ---
interface FormattersSeed {
  create<L extends AnyLocale, const F extends AnyFmt>(factory: FmtFactory<L, F>): FmtProviderCtor<FmtProvider<L, F>>;
}
export const FormattersSeed: FormattersSeed = {
  create<L extends AnyLocale, const F extends AnyFmt>(factory: FmtFactory<L, F>): FmtProviderCtor<FmtProvider<L, F>> {
    const cache = new Map<L, F>();

    const get = (locale: L): F => {
      if (cache.has(locale)) {
        return cache.get(locale)!;
      }
      const result = factory(locale);
      cache.set(locale, result);
      return result;
    };

    return class {
      readonly get = get;
      static get = get;
    } as FmtProviderCtor<FmtProvider<L, F>>;
  },
};

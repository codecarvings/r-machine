import type { AnyLocale } from "#r-machine/locale";

export type AnyFmt = object | undefined;

export type FmtGetter<L extends AnyLocale, F extends AnyFmt> = (locale: L) => F;
type FmtFactory<L extends AnyLocale, F extends AnyFmt> = FmtGetter<L, F>;
export type AnyFmtGetter = FmtGetter<AnyLocale, AnyFmt>;

export interface FmtProvider<L extends AnyLocale, F extends AnyFmt> {
  readonly get: FmtGetter<L, F>;
}
export type AnyFmtProvider = FmtProvider<any, any>;
export type OptionalFmtProvider = AnyFmtProvider | undefined;

export interface FmtProviderCtor<FP extends AnyFmtProvider> {
  new (): FP;
  readonly get: FP["get"];
}
export type ExtractFmtGetter<FP> = FP extends FmtProvider<any, any> ? FP["get"] : undefined;
export type ExtractFmt<FP> = FP extends FmtProvider<any, infer F> ? F : undefined;

export function createFormatters<L extends AnyLocale, const F extends AnyFmt>(
  factory: FmtFactory<L, F>
): FmtProviderCtor<FmtProvider<L, F>> {
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
}

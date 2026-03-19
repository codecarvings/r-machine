import type { AnyLocale } from "#r-machine/locale";

export function byLocale<T>(factory: (locale: AnyLocale) => T): (locale: AnyLocale) => T {
  const cache = new Map<AnyLocale, T>();

  return (locale) => {
    const cached = cache.get(locale);
    if (cached) {
      return cached;
    }

    const result = factory(locale);
    cache.set(locale, result);
    return result;
  };
}

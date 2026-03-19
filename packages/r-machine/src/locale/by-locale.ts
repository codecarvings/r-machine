import type { AnyLocale } from "./locale.js";

export function byLocale<T>(factory: (locale: AnyLocale) => T): (locale: AnyLocale) => T {
  const cache = new Map<AnyLocale, T>();

  return (locale) => {
    if (cache.has(locale)) {
      return cache.get(locale)!;
    }

    const result = factory(locale);
    cache.set(locale, result);
    return result;
  };
}

import type { AnyLocale } from "#r-machine/locale";
import type { AnyFmt, FmtProvider, FmtProviderCtor } from "./fmt.js";

type FmtFactory<L extends AnyLocale, F extends AnyFmt> = (locale: L) => F;

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

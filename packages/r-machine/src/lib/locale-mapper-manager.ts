import { matchLocales } from "./locale/locale-matcher.js";
import { RMachineError } from "./r-machine-error.js";

export type LocaleMapper = (locale: string) => string;

const defaultMatchLocalesAlgorithm = "lookup";

export class LocaleMapperManager {
  constructor(
    protected readonly locales: readonly string[],
    protected readonly defaultLocale: string,
    protected readonly localeMapper: LocaleMapper | undefined
  ) {}

  protected cache = new Map<string, string>();

  protected mapNewLocale(locale: string): string {
    if (this.localeMapper) {
      // Mapper provided
      const mappedLocale = this.localeMapper(locale);
      if (this.locales.includes(mappedLocale)) {
        return mappedLocale;
      } else {
        throw new RMachineError(`Mapped locale "${mappedLocale}" for "${locale}" is not supported.`);
      }
    } else {
      // Mapper not provided, use the built-in one
      return matchLocales([locale], this.locales, this.defaultLocale, {
        algorithm: defaultMatchLocalesAlgorithm,
      });
    }
  }

  readonly mapLocale = (locale: string): string => {
    const mappedLocale = this.cache.get(locale);
    if (mappedLocale !== undefined) {
      return mappedLocale;
    }

    const newMappedLocale = this.mapNewLocale(locale);
    this.cache.set(locale, newMappedLocale);
    return newMappedLocale;
  };
}

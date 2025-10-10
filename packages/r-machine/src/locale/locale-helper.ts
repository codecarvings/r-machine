import type { LocaleMapper } from "../locale-mapper-manager.js";
import { RMachineError } from "../r-machine-error.js";
import { validateCanonicalUnicodeLocaleId } from "./canonical-unicode-locale-id.js";
import { type MatchLocalesAlgorithm, matchLocales } from "./locale-matcher.js";

export class LocaleHelper {
  constructor(
    protected readonly locales: readonly string[],
    protected readonly defaultLocale: string,
    readonly mapLocale: LocaleMapper
  ) {}

  readonly matchLocales = (requestedLocales: readonly string[], algorithm?: MatchLocalesAlgorithm): string => {
    return matchLocales(requestedLocales, this.locales, this.defaultLocale, { algorithm });
  };

  readonly validateLocale = (locale: string): RMachineError | null => {
    const error = validateCanonicalUnicodeLocaleId(locale);
    if (error) {
      return error;
    }

    if (!this.locales.includes(locale)) {
      return new RMachineError(`Locale "${locale}" is not in the list of locales`);
    }

    return null;
  };

  isValidLocale = (locale: string): boolean => {
    return this.validateLocale(locale) === null;
  };
}

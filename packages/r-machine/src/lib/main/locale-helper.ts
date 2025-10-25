import { RMachineError } from "r-machine/common";
import {
  type MatchLocalesAlgorithm,
  matchLocales,
  parseAcceptLanguageHeader,
  validateCanonicalUnicodeLocaleId,
} from "r-machine/locale";
import type { LocaleMapper } from "./locale-mapper-manager.js";

export class LocaleHelper {
  constructor(
    protected readonly locales: readonly string[],
    protected readonly defaultLocale: string,
    readonly mapLocale: LocaleMapper
  ) {}

  readonly matchLocales = (requestedLocales: readonly string[], algorithm?: MatchLocalesAlgorithm): string => {
    return matchLocales(requestedLocales, this.locales, this.defaultLocale, { algorithm });
  };

  readonly matchLocalesForAcceptLanguageHeader = (
    acceptLanguageHeader: string | undefined | null,
    algorithm?: MatchLocalesAlgorithm
  ): string => {
    const requestedLocales = parseAcceptLanguageHeader(acceptLanguageHeader ?? "");
    return matchLocales(requestedLocales, this.locales, this.defaultLocale, { algorithm });
  };

  readonly validateLocale = (locale: string): RMachineError | null => {
    const error = validateCanonicalUnicodeLocaleId(locale);
    if (error) {
      return error;
    }

    if (!this.locales.includes(locale)) {
      return new RMachineError(`Locale "${locale}" is not in the list of locales.`);
    }

    return null;
  };
}

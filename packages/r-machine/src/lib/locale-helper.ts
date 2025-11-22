import { RMachineError } from "#r-machine/errors";
import { type MatchLocalesAlgorithm, matchLocales, parseAcceptLanguageHeader } from "#r-machine/locale";

export class LocaleHelper {
  constructor(
    protected readonly locales: readonly string[],
    protected readonly defaultLocale: string
  ) {
    this.localeSet = new Set(locales);
  }

  protected readonly localeSet: Set<string>;

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
    // No need to check for validateCanonicalUnicodeLocaleId since the list of locales is already validated

    if (!this.localeSet.has(locale)) {
      return new RMachineError(`Locale "${locale}" is invalid or is not in the list of locales.`);
    }

    return null;
  };
}

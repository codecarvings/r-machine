import type { AnyLocale, LocaleList } from "#r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "#r-machine/errors";
import { type MatchLocalesAlgorithm, matchLocales, parseAcceptLanguageHeader } from "#r-machine/locale";

export class LocaleHelper<L extends AnyLocale> {
  constructor(
    protected readonly locales: LocaleList<L>,
    protected readonly defaultLocale: L
  ) {
    this.localeSet = new Set(locales);
  }

  protected readonly localeSet: Set<L>;

  readonly matchLocales = (requestedLocales: readonly string[], algorithm?: MatchLocalesAlgorithm): L => {
    return matchLocales(requestedLocales, this.locales, this.defaultLocale, { algorithm }) as L;
  };

  readonly matchLocalesForAcceptLanguageHeader = (
    acceptLanguageHeader: string | undefined | null,
    algorithm?: MatchLocalesAlgorithm
  ): L => {
    const requestedLocales = parseAcceptLanguageHeader(acceptLanguageHeader ?? "");
    return matchLocales(requestedLocales, this.locales, this.defaultLocale, { algorithm }) as L;
  };

  readonly validateLocale = (locale: string): RMachineConfigError | null => {
    // No need to check for validateCanonicalUnicodeLocaleId since the list of locales is already validated

    if (!this.localeSet.has(locale as L)) {
      return new RMachineConfigError(
        ERR_UNKNOWN_LOCALE,
        `Locale "${locale}" is invalid or is not in the list of locales.`
      );
    }

    return null;
  };
}

// Spec-compliant implementation for Intl.LocaleMatcher - https://github.com/tc39/proposal-intl-localematcher

import { getCanonicalUnicodeLocaleId } from "./canonical-unicode-locale-id.js";

type Algorithm = "best-fit" | "lookup";

interface ResolveLocaleOptions {
  algorithm?: Algorithm;
}

const defaultAlgorithm: Algorithm = "best-fit";

function bestFitMatcher(
  requestedLocales: readonly string[],
  availableLocales: readonly string[],
  defaultLocale: string
): string {
  const canonicalAvailable = new Set(availableLocales.map(getCanonicalUnicodeLocaleId));

  for (const requestedLocale of requestedLocales) {
    const canonical = getCanonicalUnicodeLocaleId(requestedLocale);

    if (canonicalAvailable.has(canonical)) {
      return canonical;
    }

    const [language] = canonical.split("-");

    for (const available of availableLocales) {
      const availableCanonical = getCanonicalUnicodeLocaleId(available);
      const [availableLanguage] = availableCanonical.split("-");

      if (language === availableLanguage) {
        return availableCanonical;
      }
    }
  }

  return getCanonicalUnicodeLocaleId(defaultLocale);
}

function lookupMatcher(
  requestedLocales: readonly string[],
  availableLocales: readonly string[],
  defaultLocale: string
): string {
  const canonicalAvailable = new Set(availableLocales.map(getCanonicalUnicodeLocaleId));

  for (const requestedLocale of requestedLocales) {
    const canonical = getCanonicalUnicodeLocaleId(requestedLocale);

    if (canonicalAvailable.has(canonical)) {
      return canonical;
    }

    let candidate = canonical;
    while (true) {
      const pos = candidate.lastIndexOf("-");
      if (pos === -1) break;

      if (pos >= 2 && candidate[pos - 2] === "-") {
        candidate = candidate.slice(0, pos - 2);
      } else {
        candidate = candidate.slice(0, pos);
      }

      if (canonicalAvailable.has(candidate)) {
        return candidate;
      }
    }
  }

  return getCanonicalUnicodeLocaleId(defaultLocale);
}

export function resolveLocale(
  requestedLocales: readonly string[],
  availableLocales: readonly string[],
  defaultLocale: string,
  options: ResolveLocaleOptions = {}
): string {
  if (requestedLocales.length === 0) {
    return getCanonicalUnicodeLocaleId(defaultLocale);
  }

  if (availableLocales.length === 0) {
    return getCanonicalUnicodeLocaleId(defaultLocale);
  }

  const { algorithm = defaultAlgorithm } = options;
  const matcher = algorithm === "best-fit" ? bestFitMatcher : lookupMatcher;
  const resolvedLocale = matcher(requestedLocales, availableLocales, defaultLocale);

  return resolvedLocale;
}

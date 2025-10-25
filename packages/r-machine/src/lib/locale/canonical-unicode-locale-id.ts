import { RMachineError } from "r-machine/common";

function computeCanonicalUnicodeLocaleId(locale: string): string {
  if (locale === "") {
    return "und";
  }

  locale = locale.replace(/_/g, "-");
  const normalized = locale.replace(/-{2,}/g, "-");

  let result: string;
  try {
    [result] = Intl.getCanonicalLocales(normalized);
  } catch {
    const hasLeadingHyphen = /^-/.test(normalized);
    const trimmed = normalized.replace(/^-+|-+$/g, "");

    if (trimmed && !hasLeadingHyphen) {
      try {
        const [canonicalTrimmed] = Intl.getCanonicalLocales(trimmed);
        const suffix = normalized.match(/-+$/)?.[0] ?? "";
        result = `${canonicalTrimmed}${suffix}`;
      } catch {
        result = locale.toLowerCase();
      }
    } else {
      result = locale.toLowerCase();
    }
  }
  return result;
}

const localeIdCache = new Map<string, string>();

export function getCanonicalUnicodeLocaleId(locale: string): string {
  const cached = localeIdCache.get(locale);
  if (cached !== undefined) {
    return cached;
  }

  const result = computeCanonicalUnicodeLocaleId(locale);

  localeIdCache.set(locale, result);
  return result;
}

export function validateCanonicalUnicodeLocaleId(locale: string): RMachineError | null {
  if (locale.includes("*")) {
    return new RMachineError(
      `Invalid locale identifier: "${locale}". Wildcards are not allowed in canonical Unicode locale identifiers.`
    );
  }

  const canonical = getCanonicalUnicodeLocaleId(locale);
  if (canonical !== locale) {
    return new RMachineError(
      `Invalid locale identifier: "${locale}". It was expected a canonical Unicode locale identifier (see https://unicode.org/reports/tr35/#Canonical_Unicode_Locale_Identifiers). Did you mean: "${canonical}"?`
    );
  } else {
    return null;
  }
}

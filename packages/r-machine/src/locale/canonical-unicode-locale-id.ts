/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { ERR_INVALID_LOCALE_ID, RMachineConfigError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";

function computeCanonicalUnicodeLocaleId(locale: AnyLocale): AnyLocale {
  if (locale === "") {
    return "und";
  }

  locale = locale.replace(/_/g, "-");
  const normalized = locale.replace(/-{2,}/g, "-");

  let result: string;
  try {
    [result] = Intl.getCanonicalLocales(normalized);
  } catch {
    const trimmed = normalized.replace(/^-+|-+$/g, "");

    if (trimmed) {
      try {
        [result] = Intl.getCanonicalLocales(trimmed);
      } catch {
        result = locale.toLowerCase();
      }
    } else {
      result = locale.toLowerCase();
    }
  }
  return result;
}

const localeIdCache = new Map<AnyLocale, AnyLocale>();

export function getCanonicalUnicodeLocaleId(locale: AnyLocale): AnyLocale {
  const cached = localeIdCache.get(locale);
  if (cached !== undefined) {
    return cached;
  }

  const result = computeCanonicalUnicodeLocaleId(locale);

  localeIdCache.set(locale, result);
  return result;
}

export function validateCanonicalUnicodeLocaleId(locale: AnyLocale): RMachineConfigError | null {
  if (locale.includes("*")) {
    return new RMachineConfigError(
      ERR_INVALID_LOCALE_ID,
      `Invalid locale identifier: "${locale}". Wildcards are not allowed in canonical Unicode locale identifiers.`
    );
  }

  const canonical = getCanonicalUnicodeLocaleId(locale);
  if (canonical !== locale) {
    return new RMachineConfigError(
      ERR_INVALID_LOCALE_ID,
      `Invalid locale identifier: "${locale}". It was expected a canonical Unicode locale identifier (see https://unicode.org/reports/tr35/#Canonical_Unicode_Locale_Identifiers). Did you mean: "${canonical}"?`
    );
  } else {
    return null;
  }
}

import { validateCanonicalUnicodeLocaleId } from "./locale/canonical-unicode-locale-id.js";
import type { AnyNamespace, AnyR } from "./r.js";
import { RMachineError } from "./r-machine-error.js";

export interface RMachineConfig {
  readonly locales: readonly string[];
  readonly fallbackLocale: string;
  readonly rLoader: (locale: string, namespace: AnyNamespace) => Promise<AnyR>;
  readonly localeResolver?: (locale: string) => string;
}

export type RMachineConfigFactory = () => RMachineConfig;

export function validateRMachineConfig(config: RMachineConfig): RMachineError | null {
  if (!config.locales.length) {
    return new RMachineError("No locales provided");
  }

  for (const locale of config.locales) {
    const error = validateCanonicalUnicodeLocaleId(locale);
    if (error) {
      return error;
    }
  }

  if (new Set(config.locales).size !== config.locales.length) {
    return new RMachineError("Duplicate locales provided");
  }

  const fallbackLocaleError = validateCanonicalUnicodeLocaleId(config.fallbackLocale);
  if (fallbackLocaleError) {
    return fallbackLocaleError;
  }

  if (!config.locales.includes(config.fallbackLocale)) {
    return new RMachineError(`Fallback locale "${config.fallbackLocale}" is not in the list of locales`);
  }

  return null;
}

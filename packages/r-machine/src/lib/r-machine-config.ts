import { RMachineError } from "#r-machine/errors";
import { validateCanonicalUnicodeLocaleId } from "#r-machine/locale";
import type { RModuleResolver } from "./r-module.js";

export interface RMachineConfig {
  readonly locales: readonly string[];
  readonly defaultLocale: string;
  readonly rModuleResolver: RModuleResolver;
}

export function validateRMachineConfig(config: RMachineConfig): RMachineError | null {
  if (!config.locales.length) {
    return new RMachineError("No locales provided.");
  }

  for (const locale of config.locales) {
    const error = validateCanonicalUnicodeLocaleId(locale);
    if (error) {
      return error;
    }
  }

  if (new Set(config.locales).size !== config.locales.length) {
    return new RMachineError("Duplicate locales provided. All locales must be unique.");
  }

  const fallbackLocaleError = validateCanonicalUnicodeLocaleId(config.defaultLocale);
  if (fallbackLocaleError) {
    return fallbackLocaleError;
  }

  if (!config.locales.includes(config.defaultLocale)) {
    return new RMachineError(`Default locale "${config.defaultLocale}" is not in the list of locales.`);
  }

  return null;
}

export function cloneRMachineConfig(config: RMachineConfig): RMachineConfig {
  return {
    ...config,
    locales: [...config.locales],
  };
}

import type { AnyNamespace, AnyR } from "./r.js";
import { RMachineError } from "./r-machine-error.js";

export interface RMachineConfig {
  readonly locales: readonly string[];
  readonly fallbackLocale?: string;
  readonly rLoader: (locale: string, namespace: AnyNamespace) => Promise<AnyR>;
  readonly localeResolver?: (locale: string) => string;
}

export function validateRMachineConfig(config: RMachineConfig): RMachineError | null {
  if (!config.locales.length) {
    return new RMachineError("No locales provided");
  }

  if (new Set(config.locales).size !== config.locales.length) {
    return new RMachineError("Duplicate locales provided");
  }

  if (config.fallbackLocale !== undefined && !config.locales.includes(config.fallbackLocale)) {
    return new RMachineError(`Fallback locale "${config.fallbackLocale}" is not in the list of locales`);
  }

  return null;
}

import type { AnyRModule, RModuleResolver } from "../../src/lib/r-module.js";

export function createMockResolver(modules: Record<string, Record<string, AnyRModule>>): RModuleResolver {
  return (namespace, locale) => {
    const localeModules = modules[locale];
    if (!localeModules) {
      return Promise.reject(new Error(`No modules for locale "${locale}"`));
    }
    const mod = localeModules[namespace];
    if (!mod) {
      return Promise.reject(new Error(`No module for namespace "${namespace}" in locale "${locale}"`));
    }
    return Promise.resolve(mod);
  };
}

export function createDelayedResolver(
  modules: Record<string, Record<string, AnyRModule>>,
  delayMs = 10
): RModuleResolver {
  return (namespace, locale) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const localeModules = modules[locale];
        if (!localeModules) {
          reject(new Error(`No modules for locale "${locale}"`));
          return;
        }
        const mod = localeModules[namespace];
        if (!mod) {
          reject(new Error(`No module for namespace "${namespace}" in locale "${locale}"`));
          return;
        }
        resolve(mod);
      }, delayMs);
    });
  };
}

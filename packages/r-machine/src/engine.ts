import { Ctx } from "./ctx.js";
import type { RMachineConfig } from "./r-machine-config.js";
import { RMachineError } from "./r-machine-error.js";

export class Engine {
  constructor(protected config: RMachineConfig) {}

  protected ctxs = new Map<string, Ctx>();
  protected resolvedLocales = new Map<string, string>();

  protected resolveLocale(locale: string): string {
    if (this.config.localeResolver) {
      // Resolver provided
      const resolvedLocale = this.config.localeResolver(locale);
      if (this.config.locales.includes(resolvedLocale)) {
        return resolvedLocale;
      } else {
        throw new RMachineError(`Resolved locale "${resolvedLocale}" for "${locale}" is not supported`);
      }
    } else {
      // Resolver not provided
      if (this.config.locales.includes(locale)) {
        return locale;
      }
      if (this.config.fallbackLocale !== undefined) {
        return this.config.fallbackLocale;
      } else {
        throw new RMachineError(`Locale "${locale}" is not supported and no fallback locale is configured`);
      }
    }
  }

  getResolvedLocale(locale: string): string {
    const resolvedLocale = this.resolvedLocales.get(locale);
    if (resolvedLocale !== undefined) {
      return resolvedLocale;
    } else {
      const newResolvedLocale = this.resolveLocale(locale);
      this.resolvedLocales.set(locale, newResolvedLocale);
      return newResolvedLocale;
    }
  }

  getCtx(locale: string): Ctx {
    const ctx = this.ctxs.get(locale);
    if (ctx !== undefined) {
      // The context is already loaded or loading
      return ctx;
    } else {
      // The context has not been loaded yet nor is loading
      const newCtx = new Ctx(locale, this.config.rLoader);
      this.ctxs.set(locale, newCtx);
      return newCtx;
    }
  }
}

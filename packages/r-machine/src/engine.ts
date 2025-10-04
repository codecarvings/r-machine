import { Ctx } from "./ctx.js";
import { resolveLocale } from "./locale/resolve-locale.js";
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
      // Resolver not provided, use the built-in one
      return resolveLocale([locale], this.config.locales, this.config.fallbackLocale);
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

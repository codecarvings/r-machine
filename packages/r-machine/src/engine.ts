import type { AnyConfig } from "./config.js";
import { Ctx } from "./ctx.js";
import type { AnyLocale } from "./locale.js";

export class Engine {
  constructor(protected config: AnyConfig) {}

  protected ctxs = new Map<string, Ctx | Promise<Ctx>>();

  resolveLocale(locale: AnyLocale): AnyLocale {
    if (this.config.locales.includes(locale)) {
      return locale;
    }
    return this.config.fallbackLocale;
  }

  getCtx(locale: string): Ctx | Promise<Ctx> {
    locale = this.resolveLocale(locale);

    const ctx = this.ctxs.get(locale);
    if (ctx !== undefined) {
      // The context is already loaded or loading
      return ctx;
    } else {
      // The context has not been loaded yet nor is loading
      const newCtx = new Ctx(locale, this.config.rLoader);

      const rPick = newCtx.pickRKit(...this.config.namespacesToPreload);
      if (rPick instanceof Promise) {
        // Some namespace to preload is loading
        const pendingCtx = rPick.then(() => {
          this.ctxs.set(locale, newCtx);
          return newCtx;
        });
        this.ctxs.set(locale, pendingCtx);
        return pendingCtx;
      } else {
        // All namespaces to preload are already loaded
        this.ctxs.set(locale, newCtx);
        return newCtx;
      }
    }
  }
}

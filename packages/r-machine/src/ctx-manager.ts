import { Ctx } from "./ctx.js";
import type { RResolver } from "./r-machine-config.js";

export class CtxManager {
  constructor(protected readonly rResolver: RResolver) {}

  protected cache = new Map<string, Ctx>();

  get(locale: string): Ctx {
    const ctx = this.cache.get(locale);
    if (ctx !== undefined) {
      return ctx;
    }

    const newCtx = new Ctx(locale, this.rResolver);
    this.cache.set(locale, newCtx);
    return newCtx;
  }
}

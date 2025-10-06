import { Ctx } from "./ctx.js";
import type { RModuleResolver } from "./r-module.js";

export class CtxManager {
  constructor(protected readonly rModuleResolver: RModuleResolver) {}

  protected cache = new Map<string, Ctx>();

  get(locale: string): Ctx {
    const ctx = this.cache.get(locale);
    if (ctx !== undefined) {
      return ctx;
    }

    const newCtx = new Ctx(locale, this.rModuleResolver);
    this.cache.set(locale, newCtx);
    return newCtx;
  }
}

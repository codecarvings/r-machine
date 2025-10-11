import { Domain } from "./domain.js";
import type { RModuleResolver } from "./r-module.js";

export class DomainManager {
  constructor(protected readonly rModuleResolver: RModuleResolver) {}

  protected cache = new Map<string, Domain>();

  getDomain(locale: string): Domain {
    const domain = this.cache.get(locale);
    if (domain !== undefined) {
      return domain;
    }

    const newDomain = new Domain(locale, this.rModuleResolver);
    this.cache.set(locale, newDomain);
    return newDomain;
  }
}

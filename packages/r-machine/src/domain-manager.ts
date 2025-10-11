import { Domain } from "./domain.js";
import type { RModuleResolver } from "./r-module.js";

export class DomainManager {
  constructor(protected readonly rModuleResolver: RModuleResolver) {}

  protected cache = new Map<string, Domain>();

  getDomain(locale: string, token: string | undefined): Domain {
    const key = token === undefined ? locale : `${locale}⧺${token}`;

    const domain = this.cache.get(key);
    if (domain !== undefined) {
      return domain;
    }

    const newDomain = new Domain(locale, token, this.rModuleResolver);
    this.cache.set(key, newDomain);
    return newDomain;
  }
}

import type { AnyLocale } from "#r-machine/locale";
import { Domain } from "./domain.js";
import type { RModuleResolver } from "./r-module.js";

export class DomainManager {
  constructor(
    protected readonly rModuleResolver: RModuleResolver,
    protected readonly formatters?: (locale: AnyLocale) => object
  ) {}

  protected cache = new Map<AnyLocale, Domain>();

  getDomain(locale: AnyLocale): Domain {
    const domain = this.cache.get(locale);
    if (domain !== undefined) {
      return domain;
    }

    const newDomain = new Domain(locale, this.rModuleResolver, this.formatters);
    this.cache.set(locale, newDomain);
    return newDomain;
  }
}

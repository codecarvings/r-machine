/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { AnyLocale } from "#r-machine/locale";
import { Domain } from "./domain.js";
import type { AnyFmtGetter } from "./fmt.js";
import type { RModuleResolver } from "./r-module.js";

export class DomainManager {
  constructor(
    protected readonly rModuleResolver: RModuleResolver,
    protected readonly formatters: AnyFmtGetter
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

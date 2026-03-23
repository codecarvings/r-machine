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
import type { AnyFmt, FmtProvider, FmtProviderCtor } from "./fmt.js";

type FmtFactory<L extends AnyLocale, F extends AnyFmt> = (locale: L) => F;

interface FormattersSeed {
  create<L extends AnyLocale, const F extends AnyFmt>(factory: FmtFactory<L, F>): FmtProviderCtor<FmtProvider<L, F>>;
}
export const FormattersSeed: FormattersSeed = {
  create<L extends AnyLocale, const F extends AnyFmt>(factory: FmtFactory<L, F>): FmtProviderCtor<FmtProvider<L, F>> {
    const cache = new Map<L, F>();

    const get = (locale: L): F => {
      if (cache.has(locale)) {
        return cache.get(locale)!;
      }
      const result = factory(locale);
      cache.set(locale, result);
      return result;
    };

    return class {
      readonly get = get;
      static get = get;
    } as FmtProviderCtor<FmtProvider<L, F>>;
  },
};

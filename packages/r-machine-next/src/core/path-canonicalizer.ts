/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyLocale, AnyLocaleList } from "r-machine/locale";
import { HrefCanonicalizer } from "./href-canonicalizer.js";
import type { AnyPathAtlas } from "./path-atlas.js";

export class PathCanonicalizer extends HrefCanonicalizer {
  constructor(
    atlas: AnyPathAtlas,
    locales: AnyLocaleList,
    defaultLocale: AnyLocale,
    protected readonly implicitDefaultLocale: boolean
  ) {
    super(atlas, locales, defaultLocale);
  }

  protected override readonly adapter = {
    fn: (locale: AnyLocale, path: string): string => {
      if (this.implicitDefaultLocale && locale === this.defaultLocale) {
        return path;
      }
      const secondSlashIndex = path.indexOf("/", 1);
      if (secondSlashIndex === -1) {
        return "/";
      }
      return path.slice(secondSlashIndex);
    },
    preApply: true,
  };
}

/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
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

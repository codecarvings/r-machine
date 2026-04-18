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

import type { AnyLocale } from "r-machine/locale";
import type { AnySegment, PathAtlas, PathAtlasClass, Segment } from "#r-machine/next/core";

interface DeclaredPathAtlas<L extends AnyLocale> {
  as<const S extends AnySegment>(tree: Segment<S, L>): PathAtlasClass<PathAtlas<S>>;
}

export function declarePathAtlas<L extends AnyLocale = AnyLocale>(): DeclaredPathAtlas<L> {
  return {
    as<const S extends AnySegment>(tree: Segment<S, L>): PathAtlasClass<PathAtlas<S>> {
      return class {
        readonly segment = tree;
      } as PathAtlasClass<PathAtlas<S>>;
    },
  };
}

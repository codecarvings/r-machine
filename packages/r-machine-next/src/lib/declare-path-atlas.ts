/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyLocale } from "r-machine/locale";
import type { AnySegment, PathAtlas, PathAtlasClass, Segment } from "#r-machine/next/core";

interface DeclaredPathAtlas<L extends AnyLocale> {
  readonly as: <const S extends AnySegment>(tree: Segment<S, L>) => PathAtlasClass<PathAtlas<S>>;
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

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
import type {
  AnyPathAtlas,
  NonTranslatableSegmentDecl,
  PathAtlasProvider,
  PathAtlasProviderCtor,
} from "#r-machine/next/core";

interface CurriedPathAtlasSeed<L extends AnyLocale> {
  create<const PA extends AnyPathAtlas>(
    decl: NonTranslatableSegmentDecl<PA, L>
  ): PathAtlasProviderCtor<PathAtlasProvider<PA>>;
}

interface PathAtlasSeed {
  create<const PA extends AnyPathAtlas>(
    decl: NonTranslatableSegmentDecl<PA>
  ): PathAtlasProviderCtor<PathAtlasProvider<PA>>;
  for<L extends AnyLocale>(): CurriedPathAtlasSeed<L>;
}

export const PathAtlasSeed: PathAtlasSeed = {
  create<const PA extends AnyPathAtlas>(
    decl: NonTranslatableSegmentDecl<PA>
  ): PathAtlasProviderCtor<PathAtlasProvider<PA>> {
    return class {
      readonly decl = decl;
    } as PathAtlasProviderCtor<PathAtlasProvider<PA>>;
  },
  for<L extends AnyLocale>(): CurriedPathAtlasSeed<L> {
    return {
      create<const PA extends AnyPathAtlas>(
        decl: NonTranslatableSegmentDecl<PA, L>
      ): PathAtlasProviderCtor<PathAtlasProvider<PA>> {
        return class {
          readonly decl = decl;
        } as PathAtlasProviderCtor<PathAtlasProvider<PA>>;
      },
    };
  },
};

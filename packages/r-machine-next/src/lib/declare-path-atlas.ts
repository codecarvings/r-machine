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
  PathAtlasDeclaration,
  PathAtlasDeclarationCtor,
} from "#r-machine/next/core";

interface DeclaredPathAtlas<L extends AnyLocale> {
  as<const PA extends AnyPathAtlas>(
    decl: NonTranslatableSegmentDecl<PA, L>
  ): PathAtlasDeclarationCtor<PathAtlasDeclaration<PA>>;
}

export function declarePathAtlas<L extends AnyLocale = AnyLocale>(): DeclaredPathAtlas<L> {
  return {
    as<const PA extends AnyPathAtlas>(
      decl: NonTranslatableSegmentDecl<PA, L>
    ): PathAtlasDeclarationCtor<PathAtlasDeclaration<PA>> {
      return class {
        readonly decl = decl;
      } as PathAtlasDeclarationCtor<PathAtlasDeclaration<PA>>;
    },
  };
}

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

import type { AnyPathAtlas } from "#r-machine/next/core";

type SegmentKind = "static" | "dynamic" | "catchAll" | "optionalCatchAll";

interface SegmentData {
  readonly kind: SegmentKind | undefined;
  readonly paramKey: string | undefined;
}

export interface PathAtlasSegment extends SegmentData {
  readonly translations: {
    readonly [locale: string]: string;
  };
  readonly children: {
    [key: string]: PathAtlasSegment;
  };
}

export interface MappedSegment {
  readonly decl: boolean;
  readonly segment: string;
  readonly kind: SegmentKind;
}

export interface MappedPath {
  readonly decl: boolean;
  readonly dynamic: boolean;
  readonly segments: MappedSegment[];
}

export function getSegmentData(segment: string): SegmentData {
  let kind: SegmentKind | undefined;
  let paramKey: string | undefined;
  if (segment === "") {
    // Root segment
  } else if (segment.startsWith("[[...") && segment.endsWith("]]")) {
    kind = "optionalCatchAll";
    paramKey = segment.slice(5, -2);
  } else if (segment.startsWith("[...") && segment.endsWith("]")) {
    kind = "catchAll";
    paramKey = segment.slice(4, -1);
  } else if (segment.startsWith("[") && segment.endsWith("]")) {
    kind = "dynamic";
    paramKey = segment.slice(1, -1);
  } else {
    kind = "static";
  }

  return { kind, paramKey };
}

export function buildPathAtlasSegmentTree(
  segment: string,
  decl: object,
  locales: readonly string[],
  defaultLocale: string
): PathAtlasSegment {
  const { kind, paramKey } = getSegmentData(segment);

  const translations: { [locale: string]: string } = {};
  for (const locale of locales) {
    translations[locale] = segment;
  }

  const children: { [key: string]: PathAtlasSegment } = {};
  for (const key in decl) {
    if (key.startsWith("/")) {
      // Segment declaration
      const childDecl = (decl as Record<string, object>)[key];
      const childSegment = key.slice(1);
      children[childSegment] = buildPathAtlasSegmentTree(childSegment, childDecl, locales, defaultLocale);
    } else {
      const translationDecl: string = (decl as Record<string, string>)[key];
      const translation = translationDecl.slice(1);
      translations[key] = translation;
    }
  }

  return { kind, paramKey, translations, children };
}

interface HrefMapperAdapter {
  readonly fn: (locale: string, path: string) => string;
  readonly preApply: boolean;
}

export interface MappedHrefResult {
  readonly value: string;
  readonly dynamic: boolean;
}

export type HrefMapperFn = (locale: string, path: string, ...args: any[]) => MappedHrefResult;

export abstract class HrefMapper<F extends HrefMapperFn> {
  constructor(
    protected readonly atlas: AnyPathAtlas,
    readonly locales: readonly string[],
    readonly defaultLocale: string
  ) {
    this.segmentDataTree = buildPathAtlasSegmentTree("", this.atlas.decl, this.locales, this.defaultLocale);
    locales.forEach((locale) => {
      this.caches[locale] = new Map<string, MappedHrefResult>();
      this.mappedPathCaches[locale] = new Map<string, MappedPath>();
    });
  }

  protected readonly segmentDataTree: PathAtlasSegment;
  protected readonly adapter: HrefMapperAdapter | undefined;
  protected readonly caches: { [locale: string]: Map<string, MappedHrefResult> } = {};
  protected readonly mappedPathCaches: { [locale: string]: Map<string, MappedPath> } = {};

  readonly get: F = ((locale, path, ...args) => {
    const cache = this.caches[locale];
    let result = cache.get(path);
    if (result !== undefined) {
      return result;
    }

    let inputPath = path;
    if (this.adapter?.preApply) {
      inputPath = this.adapter.fn(locale, path);
    }
    result = this.compute(locale, inputPath, ...args);
    if (this.adapter && this.adapter.preApply === false) {
      result = {
        value: this.adapter.fn(locale, result.value),
        dynamic: result.dynamic,
      };
    }

    if (!result.dynamic) {
      // Cache only non-dynamic paths
      cache.set(path, result);
    }
    return result;
  }) as F;

  protected abstract readonly compute: F;
}

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
import type { AnyPathAtlas, AnySegment } from "#r-machine/next/core";

type SegmentKind = "static" | "dynamic" | "catchAll" | "optionalCatchAll";

interface SegmentData {
  readonly kind: SegmentKind | undefined;
  readonly paramKey: string | undefined;
}

export interface SegmentNode extends SegmentData {
  readonly translations: {
    readonly [locale: AnyLocale]: string;
  };
  readonly children: {
    [key: string]: SegmentNode;
  };
}

export interface MappedSegment {
  readonly declared: boolean;
  readonly segment: string;
  readonly kind: SegmentKind;
}

export interface MappedPath {
  readonly declared: boolean;
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

export function buildSegmentNodeTree(
  segment: string,
  source: AnySegment,
  locales: AnyLocaleList,
  defaultLocale: AnyLocale
): SegmentNode {
  const { kind, paramKey } = getSegmentData(segment);

  const translations: { [locale: AnyLocale]: string } = {};
  for (const locale of locales) {
    translations[locale] = segment;
  }

  const children: { [key: string]: SegmentNode } = {};
  for (const key in source) {
    if (key.startsWith("/")) {
      const childSegment = source[key] as AnySegment;
      const childKey = key.slice(1);
      children[childKey] = buildSegmentNodeTree(childKey, childSegment, locales, defaultLocale);
    } else {
      const translationValue = source[key] as string;
      const translation = translationValue.slice(1);
      translations[key] = translation;
    }
  }

  return { kind, paramKey, translations, children };
}

interface HrefMapperAdapter {
  readonly fn: (locale: AnyLocale, path: string) => string;
  readonly preApply: boolean;
}

export interface MappedHrefResult {
  readonly value: string;
  readonly dynamic: boolean;
}

export type HrefMapperFn = (locale: AnyLocale, path: string, ...args: any[]) => MappedHrefResult;

export abstract class HrefMapper<F extends HrefMapperFn> {
  constructor(
    protected readonly atlas: AnyPathAtlas,
    readonly locales: AnyLocaleList,
    readonly defaultLocale: AnyLocale
  ) {
    this.segmentTree = buildSegmentNodeTree("", this.atlas.segment, this.locales, this.defaultLocale);
    locales.forEach((locale) => {
      this.caches[locale] = new Map<string, MappedHrefResult>();
      this.mappedPathCaches[locale] = new Map<string, MappedPath>();
    });
  }

  protected readonly segmentTree: SegmentNode;
  protected readonly adapter: HrefMapperAdapter | undefined;
  protected readonly caches: { [locale: AnyLocale]: Map<string, MappedHrefResult> } = {};
  protected readonly mappedPathCaches: { [locale: AnyLocale]: Map<string, MappedPath> } = {};

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

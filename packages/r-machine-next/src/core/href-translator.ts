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

import type { AnyLocale } from "r-machine";
import { RMachineUsageError } from "r-machine/errors";
import { ERR_INVALID_PATH, ERR_PATH_TRANSLATION_FAILED } from "#r-machine/next/errors";
import {
  getSegmentData,
  HrefMapper,
  type MappedHrefResult,
  type MappedPath,
  type MappedSegment,
  type PathAtlasSegment,
} from "./href-mapper.js";

type HrefTranslatorFn = (locale: AnyLocale, path: string, params?: object) => MappedHrefResult;

export class HrefTranslator extends HrefMapper<HrefTranslatorFn> {
  protected readonly compute: HrefTranslatorFn = (locale, path, params) => {
    const mappedPathCache = this.mappedPathCaches[locale];
    let mappedPath = mappedPathCache.get(path);
    if (mappedPath === undefined) {
      mappedPath = this.internalCompute(locale, path);
      if (mappedPath.decl) {
        // Cache only fully declared paths
        mappedPathCache.set(path, mappedPath);
      }
    }

    return {
      value: getTranslatedHref(locale, path, mappedPath.segments, params),
      dynamic: mappedPath.dynamic,
    };
  };

  protected internalCompute(locale: AnyLocale, path: string): MappedPath {
    if (!path.startsWith("/")) {
      throw new RMachineUsageError(ERR_INVALID_PATH, `Path must start with "/".`);
    }

    const inSegments = path.split("/").filter((s) => s.length !== 0);
    if (inSegments.length === 0) {
      return { decl: true, dynamic: false, segments: [] };
    }

    const outSegments: MappedSegment[] = [];
    let pathDecl = true;
    let dynamicFound = false;

    let curSegment: PathAtlasSegment | undefined = this.segmentDataTree;
    function populateOutSegments(deep: number) {
      const inSegment = inSegments[deep];
      const childSegment: PathAtlasSegment | undefined = curSegment?.children[inSegment];
      if (childSegment !== undefined) {
        // Matching child segment found
        curSegment = childSegment;
        if (curSegment.paramKey !== undefined) {
          // Dynamic segment
          outSegments.push({ decl: true, segment: curSegment.paramKey, kind: curSegment.kind! });
          dynamicFound = true;
        } else {
          // Static segment
          outSegments.push({ decl: true, segment: curSegment.translations[locale], kind: "static" });
        }
      } else {
        // No matching child segment, use input segment as-is
        curSegment = undefined;
        const { kind, paramKey } = getSegmentData(inSegment);
        if (paramKey !== undefined) {
          // Dynamic segment
          outSegments.push({ decl: false, segment: paramKey, kind: kind! });
          dynamicFound = true;
        } else {
          // Static segment
          outSegments.push({ decl: false, segment: inSegment, kind: "static" });
        }
        pathDecl = false;
      }
      if (deep < inSegments.length - 1) {
        populateOutSegments(deep + 1);
      }
    }
    populateOutSegments(0);

    return {
      decl: pathDecl,
      dynamic: dynamicFound,
      segments: outSegments,
    };
  }
}

export function getTranslatedHref(
  locale: AnyLocale,
  path: string,
  mappedSegments: MappedSegment[],
  params?: object
): string {
  const result: string[] = [];
  function addValue(value: any) {
    const valueStr = encodeURIComponent(String(value));
    if (valueStr.length > 0) {
      result.push(valueStr);
    } else {
      throw new RMachineUsageError(
        ERR_PATH_TRANSLATION_FAILED,
        `Cannot translate path "${path}" for locale "${locale}" because a parameter value results in an empty path segment.`
      );
    }
  }

  mappedSegments.forEach((mappedSegment) => {
    if (mappedSegment.kind === "static") {
      result.push(mappedSegment.segment);
    } else {
      // Dynamic segment, substitute param if available
      const value = (params as any)?.[mappedSegment.segment];
      if (value !== undefined) {
        if (mappedSegment.kind === "dynamic") {
          addValue(value);
        } else {
          // catchAll or optionalCatchAll
          if (Array.isArray(value)) {
            value.forEach((v) => {
              addValue(v);
            });
          } else {
            throw new RMachineUsageError(
              ERR_PATH_TRANSLATION_FAILED,
              `Cannot translate path "${path}" for locale "${locale}" because parameter "${mappedSegment.segment}" is expected to be an array.`
            );
          }
        }
      } else
        throw new RMachineUsageError(
          ERR_PATH_TRANSLATION_FAILED,
          `Cannot translate path "${path}" for locale "${locale}" because parameter "${mappedSegment.segment}" is missing.`
        );
    }
  });

  return `/${result.join("/")}`;
}

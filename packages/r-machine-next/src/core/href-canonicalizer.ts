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

import { RMachineUsageError } from "r-machine/errors";
import { ERR_INVALID_PATH } from "#r-machine/next/errors";
import {
  HrefMapper,
  type MappedHrefResult,
  type MappedPath,
  type MappedSegment,
  type PathAtlasSegment,
} from "./href-mapper.js";

type HrefCanonicalizerFn = (locale: string, path: string) => MappedHrefResult;

export class HrefCanonicalizer extends HrefMapper<HrefCanonicalizerFn> {
  protected readonly compute: HrefCanonicalizerFn = (locale: string, path: string) => {
    const mappedPathCache = this.mappedPathCaches[locale];
    let mappedPath = mappedPathCache.get(path);
    if (mappedPath === undefined) {
      mappedPath = this.internalCompute(locale, path);
      if (mappedPath.decl) {
        mappedPathCache.set(path, mappedPath);
      }
    }

    return {
      value: getCanonicalizedHref(mappedPath.segments),
      dynamic: mappedPath.dynamic,
    };
  };

  protected internalCompute(locale: string, path: string): MappedPath {
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

    const populateOutSegments = (deep: number) => {
      const inSegment = inSegments[deep];

      let matchedChild: { canonical: string; child: PathAtlasSegment } | undefined;
      let dynamicChild: { canonical: string; child: PathAtlasSegment } | undefined;

      if (curSegment) {
        for (const canonicalKey in curSegment.children) {
          const child = curSegment.children[canonicalKey];
          if (child.paramKey !== undefined) {
            dynamicChild = { canonical: canonicalKey, child };
          } else if (child.translations[locale] === inSegment) {
            matchedChild = { canonical: canonicalKey, child };
            break;
          }
        }
      }

      if (matchedChild !== undefined) {
        curSegment = matchedChild.child;
        outSegments.push({ decl: true, segment: matchedChild.canonical, kind: "static" });
      } else if (dynamicChild !== undefined) {
        curSegment = dynamicChild.child;
        dynamicFound = true;

        if (dynamicChild.child.kind === "catchAll" || dynamicChild.child.kind === "optionalCatchAll") {
          for (let i = deep; i < inSegments.length; i++) {
            outSegments.push({ decl: true, segment: inSegments[i], kind: dynamicChild.child.kind });
          }
          return;
        }
        outSegments.push({ decl: true, segment: inSegment, kind: dynamicChild.child.kind! });
      } else {
        curSegment = undefined;
        outSegments.push({ decl: false, segment: inSegment, kind: "static" });
        pathDecl = false;
      }

      if (deep < inSegments.length - 1) {
        populateOutSegments(deep + 1);
      }
    };

    populateOutSegments(0);

    return {
      decl: pathDecl,
      dynamic: dynamicFound,
      segments: outSegments,
    };
  }
}

export function getCanonicalizedHref(mappedSegments: MappedSegment[]): string {
  if (mappedSegments.length === 0) {
    return "/";
  }
  return `/${mappedSegments.map((s) => s.segment).join("/")}`;
}

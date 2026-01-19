import { RMachineError } from "r-machine/errors";
import type { AnyPathAtlas } from "#r-machine/next/core";

type SegmentKind = "static" | "dynamic" | "catchAll" | "optionalCatchAll";

interface SegmentData {
  readonly kind: SegmentKind | undefined;
  readonly paramKey: string | undefined;
}

interface PathAtlasSegment extends SegmentData {
  readonly translations: {
    readonly [locale: string]: string;
  };
  readonly children: {
    [key: string]: PathAtlasSegment;
  };
}

interface MappedCanonicalSegment {
  readonly decl: boolean;
  readonly segment: string;
  readonly kind: SegmentKind;
}

interface MappedCanonicalPath {
  readonly decl: boolean;
  readonly dynamic: boolean;
  readonly segments: MappedCanonicalSegment[];
}

interface CanonicalizePathResult {
  readonly path: string;
  readonly dynamic: boolean;
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

function getCanonicalPathFromSegments(mappedSegments: MappedCanonicalSegment[]): string {
  if (mappedSegments.length === 0) {
    return "/";
  }
  return `/${mappedSegments.map((s) => s.segment).join("/")}`;
}

export class PathCanonicalizer {
  constructor(
    protected readonly atlas: AnyPathAtlas,
    protected readonly locales: readonly string[],
    protected readonly defaultLocale: string
  ) {
    this.segmentDataTree = buildPathAtlasSegmentTree("", this.atlas.decl, this.locales, this.defaultLocale);
    locales.forEach((locale) => {
      this.caches[locale] = new Map<string, CanonicalizePathResult>();
      this.mappedPathCaches[locale] = new Map<string, MappedCanonicalPath>();
    });
  }

  protected readonly segmentDataTree: PathAtlasSegment;
  protected readonly caches: { [locale: string]: Map<string, CanonicalizePathResult> } = {};
  protected readonly mappedPathCaches: { [locale: string]: Map<string, MappedCanonicalPath> } = {};

  getCanonicalPath(locale: string, path: string): CanonicalizePathResult {
    const cache = this.caches[locale];
    let result = cache.get(path);
    if (result !== undefined) {
      return result;
    }

    const mappedPathCache = this.mappedPathCaches[locale];
    let mappedPath = mappedPathCache.get(path);
    if (mappedPath === undefined) {
      mappedPath = this.getMappedCanonicalPath(locale, path);
      if (mappedPath.decl) {
        mappedPathCache.set(path, mappedPath);
      }
    }

    result = {
      path: getCanonicalPathFromSegments(mappedPath.segments),
      dynamic: mappedPath.dynamic,
    };
    if (!mappedPath.dynamic) {
      cache.set(path, result);
    }
    return result;
  }

  protected getMappedCanonicalPath(locale: string, path: string): MappedCanonicalPath {
    if (!path.startsWith("/")) {
      throw new RMachineError(`Path must start with "/".`);
    }

    const inSegments = path.split("/").filter((s) => s.length !== 0);
    if (inSegments.length === 0) {
      return { decl: true, dynamic: false, segments: [] };
    }

    const outSegments: MappedCanonicalSegment[] = [];
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

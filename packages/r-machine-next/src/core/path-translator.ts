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

interface MappedSegment {
  readonly decl: boolean;
  readonly segment: string;
  readonly kind: SegmentKind;
}

interface MappedPath {
  readonly decl: boolean;
  readonly segments: MappedSegment[];
}

export function getSegmentData(segment: string): SegmentData {
  let kind: SegmentKind | undefined;
  let paramKey: string | undefined;
  if (segment === "") {
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
  locales: string[],
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
      const childDecl = (decl as any)[key];
      const segment = key.slice(1);
      children[segment] = buildPathAtlasSegmentTree(segment, childDecl, locales, defaultLocale);
    } else {
      const translationDecl: string = (decl as any)[key];
      const translation = translationDecl.slice(1);
      translations[key] = translation;
    }
  }

  return { kind, paramKey, translations, children };
}

export class PathTranslator {
  constructor(
    protected readonly atlas: AnyPathAtlas,
    protected readonly locales: string[],
    protected readonly defaultLocale: string
  ) {
    this.segmentDataTree = buildPathAtlasSegmentTree("", this.atlas.decl, this.locales, this.defaultLocale);
    locales.forEach((locale) => {
      this.caches[locale] = new Map<string, MappedSegment[]>();
    });
  }

  protected readonly segmentDataTree: PathAtlasSegment;
  protected readonly caches: { [locale: string]: Map<string, MappedSegment[]> } = {};

  getTranslatedPath(locale: string, path: string, params?: object): string {
    const cache = this.caches[locale];
    let mappedSegments = cache.get(path);
    if (mappedSegments === undefined) {
      const mappedPath = this.getMappedPath(locale, path);
      mappedSegments = mappedPath.segments;
      if (mappedPath.decl) {
        // Cache only fully declared paths
        cache.set(path, mappedPath.segments);
      }
    }
    return getTranslatedPath(locale, path, mappedSegments, params);
  }

  protected getMappedPath(locale: string, path: string): MappedPath {
    if (!path.startsWith("/")) {
      throw new RMachineError(`Path must start with "/".`);
    }

    const inSegments = path.split("/").filter((s) => s.length !== 0);
    if (inSegments.length === 0) {
      return { decl: true, segments: [] };
    }

    const outSegments: MappedSegment[] = [];
    let pathDecl = true;

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
      segments: outSegments,
    };
  }
}

export function getTranslatedPath(
  locale: string,
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
      throw new RMachineError(
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
            throw new RMachineError(
              `Cannot translate path "${path}" for locale "${locale}" because parameter "${mappedSegment.segment}" is expected to be an array.`
            );
          }
        }
      } else
        throw new RMachineError(
          `Cannot translate path "${path}" for locale "${locale}" because parameter "${mappedSegment.segment}" is missing.`
        );
    }
  });

  return `/${result.join("/")}`;
}

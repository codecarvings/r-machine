import type { AnyPathAtlas } from "#r-machine/next/core";

type SegmentKind = "root" | "static" | "dynamic" | "catchAll" | "optionalCatchAll";

interface SegmentData {
  readonly kind: SegmentKind;
  readonly paramKey: string | undefined;
  readonly translations: {
    readonly [locale: string]: string;
  };
  readonly children: {
    [key: string]: SegmentData;
  };
}

function buildSegmentDataTree(segment: string, decl: object, locales: string[], defaultLocale: string): SegmentData {
  let kind: SegmentKind;
  let paramKey: string | undefined;
  if (segment === "") {
    kind = "root";
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

  const translations: { [locale: string]: string } = {};
  for (const locale of locales) {
    translations[locale] = segment;
  }

  const children: { [key: string]: SegmentData } = {};
  for (const key in decl) {
    if (key.startsWith("/")) {
      // Segment declaration
      const childDecl = (decl as any)[key];
      const segment = key.slice(1);
      children[segment] = buildSegmentDataTree(segment, childDecl, locales, defaultLocale);
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
    this.segmentDataTree = buildSegmentDataTree("", this.atlas.decl, this.locales, this.defaultLocale);
    locales.forEach((locale) => {
      this.caches[locale] = new Map<string, string[]>();
    });
  }

  protected readonly segmentDataTree: SegmentData;
  protected readonly caches: { [locale: string]: Map<string, string[]> } = {};

  getTranslatedPath(locale: string, path: string, params?: object): string {
    const cache = this.caches[locale];
    let segments = cache.get(path);
    if (segments === undefined) {
      segments = this.getTranslatedSegments(locale, path);
      cache.set(path, segments);
    }

    let result = segments;
    if (params !== undefined) {
      result = [...segments];
      const paramKeys = Object.keys(params);
      paramKeys.forEach((key) => {
        const value = (params as any)[key];
        let strValue: string;
        if (Array.isArray(value)) {
          strValue = value
            .map((v) => encodeURIComponent(String(v)))
            .join("/")
            .replace(/\/+/g, "/");
        } else {
          strValue = encodeURIComponent(String(value));
        }
        if (strValue.length > 0) {
          result = result.map((segment) => segment.replace(new RegExp(`^\\[${key}\\]$`), strValue));
        }
      });
    }

    return `/${result.join("/")}`;
  }

  protected getTranslatedSegments(locale: string, path: string): string[] {
    const inSegments = path.split("/").filter((s) => s.length !== 0);
    const outSegments: string[] = [];

    let curSegment: SegmentData | undefined = this.segmentDataTree;
    function populateOutSegments(deep: number) {
      const inSegment = inSegments[deep];
      const childSegment: SegmentData | undefined = curSegment?.children[inSegment];
      if (childSegment !== undefined) {
        // Matching child segment found
        curSegment = childSegment;
        if (curSegment.kind === "dynamic" || curSegment.kind === "catchAll" || curSegment.kind === "optionalCatchAll") {
          // Dynamic segment, use input segment as-is
          outSegments.push(`[${curSegment.paramKey}]`);
        } else {
          // Static segment, use translated segment
          outSegments.push(curSegment.translations[locale]);
        }
      } else {
        // No matching child segment, use input segment as-is
        curSegment = undefined;
        outSegments.push(inSegment);
      }
      if (deep < inSegments.length - 1) {
        populateOutSegments(deep + 1);
      }
    }
    populateOutSegments(0);
    return outSegments;
  }
}

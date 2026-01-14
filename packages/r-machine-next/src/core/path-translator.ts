import type { AnyPathAtlas } from "./path-atlas.js";

interface Segment {
  readonly translations: {
    readonly [locale: string]: string;
  };
  readonly children: {
    [key: string]: Segment;
  };
}

function buildSegmentTree(segment: string, decl: object, locales: string[], defaultLocale: string): Segment {
  const translations: { [locale: string]: string } = {};
  for (const locale of locales) {
    translations[locale] = segment;
  }

  const children: { [key: string]: Segment } = {};
  for (const key in decl) {
    if (key.startsWith("/")) {
      // Segment declaration
      const childDecl = (decl as any)[key];
      const segment = key.slice(1);
      children[segment] = buildSegmentTree(segment, childDecl, locales, defaultLocale);
    } else {
      const translationDecl: string = (decl as any)[key];
      const translation = translationDecl.slice(1);
      translations[key] = translation;
    }
  }

  return { translations, children };
}

export class PathTranslator {
  constructor(
    protected readonly atlas: AnyPathAtlas,
    protected readonly locales: string[],
    protected readonly defaultLocale: string
  ) {
    this.segmentTree = buildSegmentTree("", this.atlas.decl, this.locales, this.defaultLocale);
  }

  protected readonly segmentTree: Segment;

  translatePath(locale: string, path: string): string {
    const inSegments = path.split("/").filter((s) => s.length !== 0);
    let curSegment: Segment | undefined = this.segmentTree;
    const outSegments: string[] = [];

    function iterateSegmentTree(deep: number) {
      const inSegment = inSegments[deep];
      const childSegment: Segment | undefined = curSegment?.children[inSegment];
      if (childSegment !== undefined) {
        curSegment = childSegment;
        outSegments.push(curSegment.translations[locale]);
      } else {
        curSegment = undefined;
        outSegments.push(inSegment);
      }
      if (deep < inSegments.length - 1) {
        iterateSegmentTree(deep + 1);
      }
    }
    iterateSegmentTree(0);

    return `/${outSegments.join("/")}`;
  }
}

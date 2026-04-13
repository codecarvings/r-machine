/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: This is intentional for the tests */

import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  AnySegment,
  AnySegmentEntryKey,
  BuiltPathAtlas,
  PathAtlasCtor,
  Segment,
  TranslatableSegment,
} from "../../src/core/path-atlas.js";
import { buildPathAtlas } from "../../src/core/path-atlas.js";

type TestAtlas = AnyPathAtlas & { readonly segment: { "/about": {} } };

describe("AnySegmentEntryKey", () => {
  it("is the template literal type `/${string}`", () => {
    expectTypeOf<AnySegmentEntryKey>().toEqualTypeOf<`/${string}`>();
  });

  it("accepts strings starting with /", () => {
    expectTypeOf<"/about">().toExtend<AnySegmentEntryKey>();
    expectTypeOf<"/users">().toExtend<AnySegmentEntryKey>();
    expectTypeOf<"/[id]">().toExtend<AnySegmentEntryKey>();
    expectTypeOf<"/[...slug]">().toExtend<AnySegmentEntryKey>();
    expectTypeOf<"/[[...slug]]">().toExtend<AnySegmentEntryKey>();
  });

  it("rejects strings not starting with /", () => {
    expectTypeOf<"about">().not.toExtend<AnySegmentEntryKey>();
    expectTypeOf<"">().not.toExtend<AnySegmentEntryKey>();
  });
});

describe("AnyPathAtlas", () => {
  it("has a readonly segment property of type AnySegment", () => {
    expectTypeOf<AnyPathAtlas["segment"]>().toEqualTypeOf<AnySegment>();
  });
});

describe("PathAtlasCtor", () => {
  it("is a constructor that returns PAD", () => {
    expectTypeOf<PathAtlasCtor<TestAtlas>>().toEqualTypeOf<new () => TestAtlas>();
  });
});

describe("BuiltPathAtlas", () => {
  it("intersects PAD with containsTranslations boolean", () => {
    expectTypeOf<BuiltPathAtlas<TestAtlas>>().toEqualTypeOf<TestAtlas & { containsTranslations: boolean }>();
  });
});

describe("buildPathAtlas", () => {
  it("returns BuiltPathAtlas for a given PathAtlas type", () => {
    const ctor = class {
      segment = {};
    } as unknown as PathAtlasCtor<AnyPathAtlas>;
    expectTypeOf(buildPathAtlas(ctor, true)).toEqualTypeOf<BuiltPathAtlas<AnyPathAtlas>>();
  });

  it("preserves the specific PathAtlas type in the result", () => {
    interface SpecificAtlas extends AnyPathAtlas {
      readonly segment: { "/about": {} };
    }
    const ctor = class {
      readonly segment = { "/about": {} };
    } as unknown as PathAtlasCtor<SpecificAtlas>;
    expectTypeOf(buildPathAtlas(ctor, false)).toEqualTypeOf<BuiltPathAtlas<SpecificAtlas>>();
  });
});

describe("Segment", () => {
  it("accepts an empty declaration", () => {
    type PA = {};
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("accepts simple segment declarations", () => {
    type PA = { "/about": {}; "/contact": {} };
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("accepts nested segment declarations", () => {
    type PA = { "/about": { "/team": { "/leads": {} } } };
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("accepts dynamic segment declarations", () => {
    type PA = { "/[id]": {} };
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("accepts catch-all segment declarations with empty objects", () => {
    type PA = { "/[...slug]": {} };
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("accepts optional catch-all segment declarations with empty objects", () => {
    type PA = { "/[[...slug]]": {} };
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("accepts translations inside child segments via TranslatableSegment", () => {
    type PA = { "/about": { en: "/about-en"; it: "/chi-siamo" } };
    expectTypeOf<PA>().toExtend<Segment<PA>>();
  });

  it("rejects non-object segment values", () => {
    type PA = { "/about": "hello" };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });

  it("rejects keys not matching /${string} at root level", () => {
    type PA = { about: {} };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });

  it("rejects translation keys at root level", () => {
    type PA = { en: "/about" };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });

  it("rejects empty segment key /", () => {
    type PA = { "/": {} };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });

  it("rejects catch-all segments with child segments", () => {
    type PA = { "/[...slug]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });

  it("rejects optional catch-all segments with child segments", () => {
    type PA = { "/[[...slug]]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });

  it("rejects translations inside dynamic segments", () => {
    type PA = { "/[id]": { en: "/id-en" } };
    expectTypeOf<PA>().not.toExtend<Segment<PA>>();
  });
});

describe("TranslatableSegment", () => {
  it("accepts an empty declaration", () => {
    type PA = {};
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("accepts simple segment declarations", () => {
    type PA = { "/about": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("accepts translation keys with /${string} values", () => {
    type PA = { en: "/about-en"; it: "/chi-siamo" };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("accepts segments with nested translations", () => {
    type PA = { "/about": { en: "/about-en"; it: "/chi-siamo"; "/team": {} } };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("accepts dynamic segment declarations", () => {
    type PA = { "/[id]": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("accepts catch-all segment declarations with empty objects", () => {
    type PA = { "/[...slug]": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("accepts optional catch-all segment declarations with empty objects", () => {
    type PA = { "/[[...slug]]": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });

  it("rejects translation values not matching /${string}", () => {
    type PA = { en: "about" };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA>>();
  });

  it("rejects non-object segment values", () => {
    type PA = { "/about": "hello" };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA>>();
  });

  it("rejects empty segment key /", () => {
    type PA = { "/": {} };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA>>();
  });

  it("rejects catch-all segments with child segments", () => {
    type PA = { "/[...slug]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA>>();
  });

  it("rejects optional catch-all segments with child segments", () => {
    type PA = { "/[[...slug]]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA>>();
  });

  it("rejects translations inside dynamic segments", () => {
    type PA = { "/[id]": { en: "/id-en" } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA>>();
  });
});

describe("TranslatableSegment with locale constraint L", () => {
  type Locale = "en" | "it";

  it("accepts translation keys that are in L", () => {
    type PA = { en: "/about-en"; it: "/chi-siamo" };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA, Locale>>();
  });

  it("accepts a subset of L", () => {
    type PA = { en: "/about-en" };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA, Locale>>();
  });

  it("rejects translation keys not in L", () => {
    type PA = { en: "/about-en"; fr: "/a-propos" };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA, Locale>>();
  });

  it("rejects unconfigured locales in nested segments", () => {
    type PA = { "/about": { de: "/ueber-uns" } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegment<PA, Locale>>();
  });

  it("accepts segments with no translations (L has no effect)", () => {
    type PA = { "/about": {}; "/contact": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA, Locale>>();
  });

  it("with L = string (default), any locale is accepted", () => {
    type PA = { en: "/about-en"; fr: "/a-propos"; de: "/ueber-uns" };
    expectTypeOf<PA>().toExtend<TranslatableSegment<PA>>();
  });
});

describe("Segment with locale constraint L", () => {
  type Locale = "en" | "it";

  it("accepts translations with configured locales in child segments", () => {
    type PA = { "/about": { en: "/about-en"; it: "/chi-siamo" } };
    expectTypeOf<PA>().toExtend<Segment<PA, Locale>>();
  });

  it("rejects translations with unconfigured locales in child segments", () => {
    type PA = { "/about": { en: "/about-en"; fr: "/a-propos" } };
    expectTypeOf<PA>().not.toExtend<Segment<PA, Locale>>();
  });

  it("still rejects translation keys at root level regardless of L", () => {
    type PA = { en: "/about" };
    expectTypeOf<PA>().not.toExtend<Segment<PA, Locale>>();
  });
});

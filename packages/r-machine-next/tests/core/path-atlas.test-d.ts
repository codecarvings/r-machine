/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: This is intentional for the tests */

import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlasProvider,
  AnySegmentKey,
  ExtendedPathAtlasProvider,
  NonTranslatableSegmentDecl,
  PathAtlasProviderCtor,
  TranslatableSegmentDecl,
} from "../../src/core/path-atlas.js";
import { buildPathAtlas } from "../../src/core/path-atlas.js";

type TestAtlas = AnyPathAtlasProvider & { readonly decl: { "/about": {} } };

describe("AnySegmentKey", () => {
  it("is the template literal type `/${string}`", () => {
    expectTypeOf<AnySegmentKey>().toEqualTypeOf<`/${string}`>();
  });

  it("accepts strings starting with /", () => {
    expectTypeOf<"/about">().toExtend<AnySegmentKey>();
    expectTypeOf<"/users">().toExtend<AnySegmentKey>();
    expectTypeOf<"/[id]">().toExtend<AnySegmentKey>();
    expectTypeOf<"/[...slug]">().toExtend<AnySegmentKey>();
    expectTypeOf<"/[[...slug]]">().toExtend<AnySegmentKey>();
  });

  it("rejects strings not starting with /", () => {
    expectTypeOf<"about">().not.toExtend<AnySegmentKey>();
    expectTypeOf<"">().not.toExtend<AnySegmentKey>();
  });
});

describe("AnyPathAtlasProvider", () => {
  it("has a readonly decl property of type object", () => {
    expectTypeOf<AnyPathAtlasProvider["decl"]>().toEqualTypeOf<object>();
  });
});

describe("PathAtlasProviderCtor", () => {
  it("is a constructor that returns PAP", () => {
    expectTypeOf<PathAtlasProviderCtor<TestAtlas>>().toEqualTypeOf<new () => TestAtlas>();
  });
});

describe("ExtendedPathAtlasProvider", () => {
  it("intersects PAP with containsTranslations boolean", () => {
    expectTypeOf<ExtendedPathAtlasProvider<TestAtlas>>().toEqualTypeOf<TestAtlas & { containsTranslations: boolean }>();
  });
});

describe("buildPathAtlas", () => {
  it("returns ExtendedPathAtlasProvider for a given PathAtlas type", () => {
    const ctor = class {
      decl = {};
    } as unknown as PathAtlasProviderCtor<AnyPathAtlasProvider>;
    expectTypeOf(buildPathAtlas(ctor, true)).toEqualTypeOf<ExtendedPathAtlasProvider<AnyPathAtlasProvider>>();
  });

  it("preserves the specific PathAtlas type in the result", () => {
    interface SpecificAtlas extends AnyPathAtlasProvider {
      readonly decl: { "/about": {} };
    }
    const ctor = {} as PathAtlasProviderCtor<SpecificAtlas>;
    expectTypeOf(buildPathAtlas(ctor, false)).toEqualTypeOf<ExtendedPathAtlasProvider<SpecificAtlas>>();
  });
});

describe("NonTranslatableSegmentDecl", () => {
  it("accepts an empty declaration", () => {
    type PA = {};
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("accepts simple segment declarations", () => {
    type PA = { "/about": {}; "/contact": {} };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("accepts nested segment declarations", () => {
    type PA = { "/about": { "/team": { "/leads": {} } } };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("accepts dynamic segment declarations", () => {
    type PA = { "/[id]": {} };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("accepts catch-all segment declarations with empty objects", () => {
    type PA = { "/[...slug]": {} };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("accepts optional catch-all segment declarations with empty objects", () => {
    type PA = { "/[[...slug]]": {} };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("accepts translations inside child segments via TranslatableSegmentDecl", () => {
    type PA = { "/about": { en: "/about-en"; it: "/chi-siamo" } };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects non-object segment values", () => {
    type PA = { "/about": "hello" };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects keys not matching /${string} at root level", () => {
    type PA = { about: {} };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects translation keys at root level", () => {
    type PA = { en: "/about" };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects empty segment key /", () => {
    type PA = { "/": {} };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects catch-all segments with child segments", () => {
    type PA = { "/[...slug]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects optional catch-all segments with child segments", () => {
    type PA = { "/[[...slug]]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });

  it("rejects translations inside dynamic segments", () => {
    type PA = { "/[id]": { en: "/id-en" } };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA>>();
  });
});

describe("TranslatableSegmentDecl", () => {
  it("accepts an empty declaration", () => {
    type PA = {};
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("accepts simple segment declarations", () => {
    type PA = { "/about": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("accepts translation keys with /${string} values", () => {
    type PA = { en: "/about-en"; it: "/chi-siamo" };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("accepts segments with nested translations", () => {
    type PA = { "/about": { en: "/about-en"; it: "/chi-siamo"; "/team": {} } };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("accepts dynamic segment declarations", () => {
    type PA = { "/[id]": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("accepts catch-all segment declarations with empty objects", () => {
    type PA = { "/[...slug]": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("accepts optional catch-all segment declarations with empty objects", () => {
    type PA = { "/[[...slug]]": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("rejects translation values not matching /${string}", () => {
    type PA = { en: "about" };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("rejects non-object segment values", () => {
    type PA = { "/about": "hello" };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("rejects empty segment key /", () => {
    type PA = { "/": {} };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("rejects catch-all segments with child segments", () => {
    type PA = { "/[...slug]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("rejects optional catch-all segments with child segments", () => {
    type PA = { "/[[...slug]]": { "/child": {} } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA>>();
  });

  it("rejects translations inside dynamic segments", () => {
    type PA = { "/[id]": { en: "/id-en" } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA>>();
  });
});

describe("TranslatableSegmentDecl with locale constraint L", () => {
  type Locale = "en" | "it";

  it("accepts translation keys that are in L", () => {
    type PA = { en: "/about-en"; it: "/chi-siamo" };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA, Locale>>();
  });

  it("accepts a subset of L", () => {
    type PA = { en: "/about-en" };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA, Locale>>();
  });

  it("rejects translation keys not in L", () => {
    type PA = { en: "/about-en"; fr: "/a-propos" };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA, Locale>>();
  });

  it("rejects unconfigured locales in nested segments", () => {
    type PA = { "/about": { de: "/ueber-uns" } };
    expectTypeOf<PA>().not.toExtend<TranslatableSegmentDecl<PA, Locale>>();
  });

  it("accepts segments with no translations (L has no effect)", () => {
    type PA = { "/about": {}; "/contact": {} };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA, Locale>>();
  });

  it("with L = string (default), any locale is accepted", () => {
    type PA = { en: "/about-en"; fr: "/a-propos"; de: "/ueber-uns" };
    expectTypeOf<PA>().toExtend<TranslatableSegmentDecl<PA>>();
  });
});

describe("NonTranslatableSegmentDecl with locale constraint L", () => {
  type Locale = "en" | "it";

  it("accepts translations with configured locales in child segments", () => {
    type PA = { "/about": { en: "/about-en"; it: "/chi-siamo" } };
    expectTypeOf<PA>().toExtend<NonTranslatableSegmentDecl<PA, Locale>>();
  });

  it("rejects translations with unconfigured locales in child segments", () => {
    type PA = { "/about": { en: "/about-en"; fr: "/a-propos" } };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA, Locale>>();
  });

  it("still rejects translation keys at root level regardless of L", () => {
    type PA = { en: "/about" };
    expectTypeOf<PA>().not.toExtend<NonTranslatableSegmentDecl<PA, Locale>>();
  });
});

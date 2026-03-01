import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyPathAtlas,
  AnySegmentKey,
  ExtendedPathAtlas,
  NonTranslatableSegmentDecl,
  PathAtlasCtor,
  TranslatableSegmentDecl,
} from "../../src/core/path-atlas.js";
import { buildPathAtlas } from "../../src/core/path-atlas.js";

type TestAtlas = AnyPathAtlas & { readonly decl: { "/about": {} } };

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

describe("AnyPathAtlas", () => {
  it("has a readonly decl property of type object", () => {
    expectTypeOf<AnyPathAtlas["decl"]>().toEqualTypeOf<object>();
  });
});

describe("PathAtlasCtor", () => {
  it("is a constructor that returns PA", () => {
    expectTypeOf<PathAtlasCtor<TestAtlas>>().toEqualTypeOf<new () => TestAtlas>();
  });
});

describe("ExtendedPathAtlas", () => {
  it("intersects PA with containsTranslations boolean", () => {
    expectTypeOf<ExtendedPathAtlas<TestAtlas>>().toEqualTypeOf<
      TestAtlas & { containsTranslations: boolean }
    >();
  });
});

describe("buildPathAtlas", () => {
  it("returns ExtendedPathAtlas for a given PathAtlas type", () => {
    const ctor = class {
      decl = {};
    } as unknown as PathAtlasCtor<AnyPathAtlas>;
    expectTypeOf(buildPathAtlas(ctor, true)).toEqualTypeOf<ExtendedPathAtlas<AnyPathAtlas>>();
  });

  it("preserves the specific PathAtlas type in the result", () => {
    interface SpecificAtlas extends AnyPathAtlas {
      readonly decl: { "/about": {} };
    }
    const ctor = {} as PathAtlasCtor<SpecificAtlas>;
    expectTypeOf(buildPathAtlas(ctor, false)).toEqualTypeOf<ExtendedPathAtlas<SpecificAtlas>>();
  });
});

describe("NonTranslatableSegmentDecl", () => {
  it("accepts an empty declaration", () => {
    type D = {};
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("accepts simple segment declarations", () => {
    type D = { "/about": {}; "/contact": {} };
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("accepts nested segment declarations", () => {
    type D = { "/about": { "/team": { "/leads": {} } } };
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("accepts dynamic segment declarations", () => {
    type D = { "/[id]": {} };
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("accepts catch-all segment declarations with empty objects", () => {
    type D = { "/[...slug]": {} };
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("accepts optional catch-all segment declarations with empty objects", () => {
    type D = { "/[[...slug]]": {} };
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("accepts translations inside child segments via TranslatableSegmentDecl", () => {
    type D = { "/about": { en: "/about-en"; it: "/chi-siamo" } };
    expectTypeOf<D>().toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects non-object segment values", () => {
    type D = { "/about": "hello" };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects keys not matching /${string} at root level", () => {
    type D = { about: {} };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects translation keys at root level", () => {
    type D = { en: "/about" };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects empty segment key /", () => {
    type D = { "/": {} };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects catch-all segments with child segments", () => {
    type D = { "/[...slug]": { "/child": {} } };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects optional catch-all segments with child segments", () => {
    type D = { "/[[...slug]]": { "/child": {} } };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });

  it("rejects translations inside dynamic segments", () => {
    type D = { "/[id]": { en: "/id-en" } };
    expectTypeOf<D>().not.toExtend<NonTranslatableSegmentDecl<D>>();
  });
});

describe("TranslatableSegmentDecl", () => {
  it("accepts an empty declaration", () => {
    type D = {};
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("accepts simple segment declarations", () => {
    type D = { "/about": {} };
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("accepts translation keys with /${string} values", () => {
    type D = { en: "/about-en"; it: "/chi-siamo" };
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("accepts segments with nested translations", () => {
    type D = { "/about": { en: "/about-en"; it: "/chi-siamo"; "/team": {} } };
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("accepts dynamic segment declarations", () => {
    type D = { "/[id]": {} };
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("accepts catch-all segment declarations with empty objects", () => {
    type D = { "/[...slug]": {} };
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("accepts optional catch-all segment declarations with empty objects", () => {
    type D = { "/[[...slug]]": {} };
    expectTypeOf<D>().toExtend<TranslatableSegmentDecl<D>>();
  });

  it("rejects translation values not matching /${string}", () => {
    type D = { en: "about" };
    expectTypeOf<D>().not.toExtend<TranslatableSegmentDecl<D>>();
  });

  it("rejects non-object segment values", () => {
    type D = { "/about": "hello" };
    expectTypeOf<D>().not.toExtend<TranslatableSegmentDecl<D>>();
  });

  it("rejects empty segment key /", () => {
    type D = { "/": {} };
    expectTypeOf<D>().not.toExtend<TranslatableSegmentDecl<D>>();
  });

  it("rejects catch-all segments with child segments", () => {
    type D = { "/[...slug]": { "/child": {} } };
    expectTypeOf<D>().not.toExtend<TranslatableSegmentDecl<D>>();
  });

  it("rejects optional catch-all segments with child segments", () => {
    type D = { "/[[...slug]]": { "/child": {} } };
    expectTypeOf<D>().not.toExtend<TranslatableSegmentDecl<D>>();
  });

  it("rejects translations inside dynamic segments", () => {
    type D = { "/[id]": { en: "/id-en" } };
    expectTypeOf<D>().not.toExtend<TranslatableSegmentDecl<D>>();
  });
});

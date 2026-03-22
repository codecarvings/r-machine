/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: This is intentional for the tests */

import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlasProvider, NonTranslatableSegmentDecl } from "../../src/core/index.js";
import { PathAtlasSeed } from "../../src/lib/path-atlas-decl-factory.js";

describe("PathAtlasSeed", () => {
  describe("create", () => {
    describe("instance decl type", () => {
      it("returns {} for an empty declaration", () => {
        const Ctor = PathAtlasSeed.create({});
        expectTypeOf(new Ctor().decl).toBeObject();
      });

      it("returns the const-inferred type for a typed declaration", () => {
        const decl = {
          "/about": {},
          "/contact": {},
          "/users": { "/[id]": {} },
          "/docs": { "/[...slug]": {} },
          "/help": { "/[[...slug]]": {} },
          "/api": { "/v1": { "/users": { "/profile": {} } } },
        } as const;
        expectTypeOf(new (PathAtlasSeed.create(decl))().decl).toEqualTypeOf(decl);
      });

      it("infers the exact literal type of the argument", () => {
        const Ctor = PathAtlasSeed.create({ "/about": {}, "/contact": {} });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{ readonly "/about": {}; readonly "/contact": {} }>();
      });

      it("preserves nested structure in the return type", () => {
        const Ctor = PathAtlasSeed.create({ "/about": { "/team": { "/leads": {} } } });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{
          readonly "/about": { readonly "/team": { readonly "/leads": {} } };
        }>();
      });

      it("preserves translation values in the return type", () => {
        const Ctor = PathAtlasSeed.create({
          "/about": { en: "/about-en", it: "/chi-siamo" },
        });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{
          readonly "/about": { readonly en: "/about-en"; readonly it: "/chi-siamo" };
        }>();
      });
    });

    describe("satisfies AnyPathAtlasProvider", () => {
      it("instance satisfies AnyPathAtlasProvider", () => {
        const Ctor = PathAtlasSeed.create({ "/about": {} });
        expectTypeOf(new Ctor()).toExtend<AnyPathAtlasProvider>();
      });
    });

    describe("extensibility", () => {
      it("returned class is extensible", () => {
        const Base = PathAtlasSeed.create({ "/about": {} });
        class MyAtlas extends Base {}
        expectTypeOf(new MyAtlas().decl).toEqualTypeOf<{ readonly "/about": {} }>();
      });
    });
  });

  describe("valid declarations", () => {
    it("accepts deeply nested segments", () => {
      PathAtlasSeed.create({
        "/api": { "/v1": { "/users": { "/profile": { "/settings": {} } } } },
      });
    });

    it("accepts a dynamic segment", () => {
      PathAtlasSeed.create({ "/[id]": {} });
    });

    it("accepts a dynamic segment with child segments", () => {
      PathAtlasSeed.create({
        "/[id]": { "/posts": {}, "/comments": {} },
      });
    });

    it("accepts nested dynamic segments", () => {
      PathAtlasSeed.create({
        "/users": { "/[userId]": { "/posts": { "/[postId]": {} } } },
      });
    });

    it("accepts a catch-all segment with an empty object", () => {
      PathAtlasSeed.create({ "/[...slug]": {} });
    });

    it("accepts an optional catch-all segment with an empty object", () => {
      PathAtlasSeed.create({ "/[[...slug]]": {} });
    });

    it("accepts catch-all nested inside a static segment", () => {
      PathAtlasSeed.create({
        "/docs": { "/[...slug]": {} },
      });
    });

    it("accepts optional catch-all nested inside a static segment", () => {
      PathAtlasSeed.create({
        "/help": { "/[[...slug]]": {} },
      });
    });

    it("accepts translations inside static child segments (via TranslatableSegmentDecl)", () => {
      PathAtlasSeed.create({
        "/about": { en: "/about-en", it: "/chi-siamo" },
      });
    });

    it("accepts translations alongside child segments inside static segments", () => {
      PathAtlasSeed.create({
        "/about": {
          en: "/about-en",
          it: "/chi-siamo",
          "/team": {},
        },
      });
    });

    it("accepts translations at multiple nesting levels", () => {
      PathAtlasSeed.create({
        "/about": {
          en: "/about-en",
          it: "/chi-siamo",
          "/team": {
            en: "/our-team",
            it: "/il-nostro-team",
            "/leads": {},
          },
        },
      });
    });

    it("accepts a dynamic segment inside a translated static segment", () => {
      PathAtlasSeed.create({
        "/products": {
          en: "/products-en",
          it: "/prodotti",
          "/[id]": {},
        },
      });
    });

    it("accepts a catch-all inside a translated static segment", () => {
      PathAtlasSeed.create({
        "/docs": {
          en: "/documentation",
          it: "/documentazione",
          "/[...slug]": {},
        },
      });
    });
  });

  describe("invalid declarations", () => {
    it("rejects a key not matching /${string} at root level", () => {
      type Decl = { about: {} };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects multiple invalid keys at root level", () => {
      type Decl = { about: {}; contact: {} };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a translation key at root level", () => {
      type Decl = { en: "/about" };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects the empty segment key /", () => {
      type Decl = { "/": {} };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a non-object segment value (string)", () => {
      type Decl = { "/about": "hello" };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a non-object segment value (number)", () => {
      type Decl = { "/about": 42 };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a non-object segment value (boolean)", () => {
      type Decl = { "/about": true };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a non-object segment value (null)", () => {
      type Decl = { "/about": null };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a catch-all segment with child segments", () => {
      type Decl = { "/[...slug]": { "/child": {} } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects an optional catch-all segment with child segments", () => {
      type Decl = { "/[[...slug]]": { "/child": {} } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects translations inside dynamic segments", () => {
      type Decl = { "/[id]": { en: "/id-en" } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects translations inside catch-all segments", () => {
      type Decl = { "/[...slug]": { en: "/slug-en" } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects translations inside optional catch-all segments", () => {
      type Decl = { "/[[...slug]]": { en: "/slug-en" } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects invalid keys nested inside a static segment", () => {
      type Decl = { "/about": { team: {} } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects non-object values in nested segments", () => {
      type Decl = { "/about": { "/team": "hello" } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects translation values not matching /${string} in child segments", () => {
      type Decl = { "/about": { en: "about-en" } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a non-object dynamic segment value", () => {
      type Decl = { "/[id]": "string" };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects the empty segment key / in nested context", () => {
      type Decl = { "/about": { "/": {} } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a catch-all segment with nested catch-all", () => {
      type Decl = { "/[...slug]": { "/[...nested]": {} } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects a dynamic segment with a non-object nested value", () => {
      type Decl = { "/[id]": { "/posts": 42 } };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });

    it("rejects mixed valid and invalid keys at root", () => {
      type Decl = { "/valid": {}; invalid: {} };
      expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl>>();
    });
  });
});

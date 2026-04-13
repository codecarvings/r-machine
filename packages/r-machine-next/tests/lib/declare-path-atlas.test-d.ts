/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: This is intentional for the tests */

import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlasDeclaration, NonTranslatableSegmentDecl } from "../../src/core/index.js";
import { declarePathAtlas } from "../../src/lib/declare-path-atlas.js";

describe("declarePathAtlas", () => {
  describe("as", () => {
    describe("instance decl type", () => {
      it("returns {} for an empty declaration", () => {
        const Ctor = declarePathAtlas().as({});
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
        expectTypeOf(new (declarePathAtlas().as(decl))().decl).toEqualTypeOf(decl);
      });

      it("infers the exact literal type of the argument", () => {
        const Ctor = declarePathAtlas().as({ "/about": {}, "/contact": {} });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{ readonly "/about": {}; readonly "/contact": {} }>();
      });

      it("preserves nested structure in the return type", () => {
        const Ctor = declarePathAtlas().as({ "/about": { "/team": { "/leads": {} } } });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{
          readonly "/about": { readonly "/team": { readonly "/leads": {} } };
        }>();
      });

      it("preserves translation values in the return type", () => {
        const Ctor = declarePathAtlas().as({
          "/about": { en: "/about-en", it: "/chi-siamo" },
        });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{
          readonly "/about": { readonly en: "/about-en"; readonly it: "/chi-siamo" };
        }>();
      });
    });

    describe("satisfies AnyPathAtlasDeclaration", () => {
      it("instance satisfies AnyPathAtlasDeclaration", () => {
        const Ctor = declarePathAtlas().as({ "/about": {} });
        expectTypeOf(new Ctor()).toExtend<AnyPathAtlasDeclaration>();
      });
    });

    describe("extensibility", () => {
      it("returned class is extensible", () => {
        const Base = declarePathAtlas().as({ "/about": {} });
        class MyAtlas extends Base {}
        expectTypeOf(new MyAtlas().decl).toEqualTypeOf<{ readonly "/about": {} }>();
      });
    });
  });

  describe("valid declarations", () => {
    it("accepts deeply nested segments", () => {
      declarePathAtlas().as({
        "/api": { "/v1": { "/users": { "/profile": { "/settings": {} } } } },
      });
    });

    it("accepts a dynamic segment", () => {
      declarePathAtlas().as({ "/[id]": {} });
    });

    it("accepts a dynamic segment with child segments", () => {
      declarePathAtlas().as({
        "/[id]": { "/posts": {}, "/comments": {} },
      });
    });

    it("accepts nested dynamic segments", () => {
      declarePathAtlas().as({
        "/users": { "/[userId]": { "/posts": { "/[postId]": {} } } },
      });
    });

    it("accepts a catch-all segment with an empty object", () => {
      declarePathAtlas().as({ "/[...slug]": {} });
    });

    it("accepts an optional catch-all segment with an empty object", () => {
      declarePathAtlas().as({ "/[[...slug]]": {} });
    });

    it("accepts catch-all nested inside a static segment", () => {
      declarePathAtlas().as({
        "/docs": { "/[...slug]": {} },
      });
    });

    it("accepts optional catch-all nested inside a static segment", () => {
      declarePathAtlas().as({
        "/help": { "/[[...slug]]": {} },
      });
    });

    it("accepts translations inside static child segments (via TranslatableSegmentDecl)", () => {
      declarePathAtlas().as({
        "/about": { en: "/about-en", it: "/chi-siamo" },
      });
    });

    it("accepts translations alongside child segments inside static segments", () => {
      declarePathAtlas().as({
        "/about": {
          en: "/about-en",
          it: "/chi-siamo",
          "/team": {},
        },
      });
    });

    it("accepts translations at multiple nesting levels", () => {
      declarePathAtlas().as({
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
      declarePathAtlas().as({
        "/products": {
          en: "/products-en",
          it: "/prodotti",
          "/[id]": {},
        },
      });
    });

    it("accepts a catch-all inside a translated static segment", () => {
      declarePathAtlas().as({
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

  describe("declarePathAtlas<L>().as — locale-constrained declarations", () => {
    type Locale = "en" | "it";

    describe("valid declarations", () => {
      it("accepts translations with configured locales", () => {
        declarePathAtlas<Locale>().as({
          "/about": { en: "/about-en", it: "/chi-siamo" },
        });
      });

      it("accepts a subset of configured locales", () => {
        declarePathAtlas<Locale>().as({
          "/about": { en: "/about-en" },
        });
      });

      it("accepts segments without translations", () => {
        declarePathAtlas<Locale>().as({
          "/about": {},
          "/contact": {},
        });
      });

      it("accepts translations at multiple nesting levels", () => {
        declarePathAtlas<Locale>().as({
          "/about": {
            en: "/about-en",
            it: "/chi-siamo",
            "/team": {
              en: "/our-team",
              it: "/il-nostro-team",
            },
          },
        });
      });

      it("accepts dynamic segments alongside constrained translations", () => {
        declarePathAtlas<Locale>().as({
          "/products": {
            en: "/products-en",
            it: "/prodotti",
            "/[id]": {},
          },
        });
      });
    });

    describe("invalid declarations", () => {
      it("rejects translations with unconfigured locales", () => {
        type Decl = { "/about": { en: "/about-en"; fr: "/a-propos" } };
        expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl, Locale>>();
      });

      it("rejects unconfigured locales in nested segments", () => {
        type Decl = { "/about": { "/team": { de: "/team-de" } } };
        expectTypeOf<Decl>().not.toExtend<NonTranslatableSegmentDecl<Decl, Locale>>();
      });
    });

    describe("backward compatibility", () => {
      it("without locale constraint, any locale is accepted (L defaults to AnyLocale)", () => {
        declarePathAtlas().as({
          "/about": { en: "/about-en", fr: "/a-propos", de: "/ueber-uns" },
        });
      });
    });

    describe("type inference", () => {
      it("preserves the exact literal type of the declaration", () => {
        const Ctor = declarePathAtlas<Locale>().as({
          "/about": { en: "/about-en", it: "/chi-siamo" },
        });
        expectTypeOf(new Ctor().decl).toEqualTypeOf<{
          readonly "/about": { readonly en: "/about-en"; readonly it: "/chi-siamo" };
        }>();
      });

      it("instance satisfies AnyPathAtlasDeclaration", () => {
        const Ctor = declarePathAtlas<Locale>().as({ "/about": {} });
        expectTypeOf(new Ctor()).toExtend<AnyPathAtlasDeclaration>();
      });

      it("returned class is extensible", () => {
        const Base = declarePathAtlas<Locale>().as({ "/about": {} });
        class MyAtlas extends Base {}
        expectTypeOf(new MyAtlas().decl).toEqualTypeOf<{ readonly "/about": {} }>();
      });
    });
  });
});

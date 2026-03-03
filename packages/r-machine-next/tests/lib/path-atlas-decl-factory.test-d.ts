/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: This is intentional for the tests */

import { describe, expectTypeOf, it } from "vitest";
import type { NonTranslatableSegmentDecl } from "../../src/core/index.js";
import { createPathAtlasDecl } from "../../src/lib/path-atlas-decl-factory.js";

describe("createPathAtlasDecl", () => {
  describe("return type", () => {
    it("returns {} for an empty declaration", () => {
      expectTypeOf(createPathAtlasDecl({})).toEqualTypeOf<{}>();
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
      expectTypeOf(createPathAtlasDecl(decl)).toEqualTypeOf(decl);
    });

    it("infers the exact literal type of the argument", () => {
      const result = createPathAtlasDecl({ "/about": {}, "/contact": {} });
      expectTypeOf(result).toEqualTypeOf<{ readonly "/about": {}; readonly "/contact": {} }>();
    });

    it("preserves nested structure in the return type", () => {
      const result = createPathAtlasDecl({ "/about": { "/team": { "/leads": {} } } });
      expectTypeOf(result).toEqualTypeOf<{
        readonly "/about": { readonly "/team": { readonly "/leads": {} } };
      }>();
    });

    it("preserves translation values in the return type", () => {
      const result = createPathAtlasDecl({
        "/about": { en: "/about-en", it: "/chi-siamo" },
      });
      expectTypeOf(result).toEqualTypeOf<{
        readonly "/about": { readonly en: "/about-en"; readonly it: "/chi-siamo" };
      }>();
    });
  });

  describe("valid declarations", () => {
    it("accepts deeply nested segments", () => {
      createPathAtlasDecl({
        "/api": { "/v1": { "/users": { "/profile": { "/settings": {} } } } },
      });
    });

    it("accepts a dynamic segment", () => {
      createPathAtlasDecl({ "/[id]": {} });
    });

    it("accepts a dynamic segment with child segments", () => {
      createPathAtlasDecl({
        "/[id]": { "/posts": {}, "/comments": {} },
      });
    });

    it("accepts nested dynamic segments", () => {
      createPathAtlasDecl({
        "/users": { "/[userId]": { "/posts": { "/[postId]": {} } } },
      });
    });

    it("accepts a catch-all segment with an empty object", () => {
      createPathAtlasDecl({ "/[...slug]": {} });
    });

    it("accepts an optional catch-all segment with an empty object", () => {
      createPathAtlasDecl({ "/[[...slug]]": {} });
    });

    it("accepts catch-all nested inside a static segment", () => {
      createPathAtlasDecl({
        "/docs": { "/[...slug]": {} },
      });
    });

    it("accepts optional catch-all nested inside a static segment", () => {
      createPathAtlasDecl({
        "/help": { "/[[...slug]]": {} },
      });
    });

    it("accepts translations inside static child segments (via TranslatableSegmentDecl)", () => {
      createPathAtlasDecl({
        "/about": { en: "/about-en", it: "/chi-siamo" },
      });
    });

    it("accepts translations alongside child segments inside static segments", () => {
      createPathAtlasDecl({
        "/about": {
          en: "/about-en",
          it: "/chi-siamo",
          "/team": {},
        },
      });
    });

    it("accepts translations at multiple nesting levels", () => {
      createPathAtlasDecl({
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
      createPathAtlasDecl({
        "/products": {
          en: "/products-en",
          it: "/prodotti",
          "/[id]": {},
        },
      });
    });

    it("accepts a catch-all inside a translated static segment", () => {
      createPathAtlasDecl({
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

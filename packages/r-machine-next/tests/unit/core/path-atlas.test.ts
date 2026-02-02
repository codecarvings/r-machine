import { describe, expect, test } from "vitest";
import type { AnyPathAtlas, ExtendedPathAtlas } from "../../../src/core/path-atlas.js";
import { buildPathAtlas } from "../../../src/core/path-atlas.js";

function createPathAtlasClass(decl: object): new () => AnyPathAtlas {
  return class {
    readonly decl = decl;
  };
}

describe("buildPathAtlas", () => {
  describe("valid declarations", () => {
    test("accepts empty declaration", () => {
      const PA = createPathAtlasClass({});
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toEqual({});
    });

    test("accepts simple static segment", () => {
      const PA = createPathAtlasClass({
        "/about": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toEqual({ "/about": {} });
    });

    test("accepts multiple static segments at same level", () => {
      const PA = createPathAtlasClass({
        "/about": {},
        "/contact": {},
        "/products": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(Object.keys(atlas.decl)).toHaveLength(3);
    });

    test("accepts nested static segments", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {},
          "/history": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toEqual({
        "/about": {
          "/team": {},
          "/history": {},
        },
      });
    });

    test("accepts deeply nested segments", () => {
      const PA = createPathAtlasClass({
        "/api": {
          "/v1": {
            "/users": {
              "/profile": {},
            },
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts dynamic segment", () => {
      const PA = createPathAtlasClass({
        "/users": {
          "/[id]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts catch-all segment with empty object", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...slug]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts optional catch-all segment with empty object", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[[...slug]]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts segment with locale translations", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "/about",
          it: "/chi-siamo",
          fr: "/a-propos",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts segment with both translations and child segments", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
          "/team": {
            it: "/staff",
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts mixed static and single dynamic child", () => {
      const PA = createPathAtlasClass({
        "/products": {
          "/featured": {},
          "/[id]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts dynamic segment at root level", () => {
      const PA = createPathAtlasClass({
        "/[slug]": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts nested dynamic segments at different levels", () => {
      const PA = createPathAtlasClass({
        "/[category]": {
          "/[productId]": {
            "/[variant]": {},
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts complex real-world structure", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
          "/team": {
            it: "/staff",
          },
          "/contact": {},
        },
        "/products": {
          it: "/prodotti",
          "/[id]": {
            "/reviews": {
              it: "/recensioni",
            },
          },
        },
        "/docs": {
          "/[...slug]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts segment with hyphenated name", () => {
      const PA = createPathAtlasClass({
        "/about-us": {},
        "/contact-form": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts segment with numeric characters", () => {
      const PA = createPathAtlasClass({
        "/v1": {
          "/api2": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });
  });

  describe("invalid segment declarations", () => {
    test("throws on empty segment key", () => {
      const PA = createPathAtlasClass({
        "/": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Invalid empty segment key at path "/"');
    });

    test("throws on nested empty segment key", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Invalid empty segment key at path "/about"');
    });

    test("throws when segment value is null", () => {
      const PA = createPathAtlasClass({
        "/about": null,
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment declarations must be objects at path "/about"');
    });

    test("throws when segment value is a string", () => {
      const PA = createPathAtlasClass({
        "/about": "invalid",
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment declarations must be objects at path "/about"');
    });

    test("throws when segment value is a number", () => {
      const PA = createPathAtlasClass({
        "/about": 123,
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment declarations must be objects at path "/about"');
    });

    test("throws when segment value is undefined", () => {
      const PA = createPathAtlasClass({
        "/about": undefined,
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment declarations must be objects at path "/about"');
    });

    test("throws when nested segment value is not an object", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": "invalid",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment declarations must be objects at path "/about/team"');
    });
  });

  describe("catch-all segment validation", () => {
    test("throws when catch-all has child segments", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...slug]": {
            "/child": {},
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Catch-all segment declarations must not have child segments at path "/docs/[...slug]"'
      );
    });

    test("throws when optional catch-all has child segments", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[[...slug]]": {
            "/child": {},
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Catch-all segment declarations must not have child segments at path "/docs/[[...slug]]"'
      );
    });

    test("throws when catch-all has nested dynamic segment", () => {
      const PA = createPathAtlasClass({
        "/[...path]": {
          "/[id]": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Catch-all segment declarations must not have child segments at path "/[...path]"'
      );
    });

    test("throws when catch-all has deeply nested child", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...slug]": {
            "/nested": {
              "/deep": {},
            },
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Catch-all segment declarations must not have child segments at path "/docs/[...slug]"'
      );
    });
  });

  describe("dynamic segment translation validation", () => {
    test("throws when dynamic segment has translation", () => {
      const PA = createPathAtlasClass({
        "/users": {
          "/[id]": {
            it: "/utente",
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Dynamic segments do not accept translations at path "/users/[id]". Got "it"'
      );
    });

    test("throws when catch-all segment has translation", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...slug]": {
            it: "/percorso",
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Dynamic segments do not accept translations at path "/docs/[...slug]". Got "it"'
      );
    });

    test("throws when optional catch-all segment has translation", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[[...slug]]": {
            it: "/percorso",
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Dynamic segments do not accept translations at path "/docs/[[...slug]]". Got "it"'
      );
    });

    test("throws when dynamic segment has multiple translations", () => {
      const PA = createPathAtlasClass({
        "/[id]": {
          en: "/id",
          it: "/identificatore",
          fr: "/identifiant",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Dynamic segments do not accept translations at path "/[id]". Got "en", "it", "fr"'
      );
    });

    test("throws when nested dynamic segment has translation", () => {
      const PA = createPathAtlasClass({
        "/products": {
          it: "/prodotti",
          "/[category]": {
            "/[id]": {
              it: "/identificatore",
            },
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Dynamic segments do not accept translations at path "/products/[category]/[id]". Got "it"'
      );
    });

    test("accepts dynamic segment with child segments only", () => {
      const PA = createPathAtlasClass({
        "/users": {
          "/[id]": {
            "/profile": {},
            "/settings": {},
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts dynamic segment with empty object", () => {
      const PA = createPathAtlasClass({
        "/[id]": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });
  });

  describe("multiple dynamic children validation", () => {
    test("throws when root has multiple dynamic segments", () => {
      const PA = createPathAtlasClass({
        "/[id]": {},
        "/[slug]": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/has multiple dynamic children.*\/\[id\].*\/\[slug\]/);
    });

    test("throws when nested level has multiple dynamic segments", () => {
      const PA = createPathAtlasClass({
        "/products": {
          "/[id]": {},
          "/[sku]": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/has multiple dynamic children/);
    });

    test("throws when mixing dynamic and catch-all at same level", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[id]": {},
          "/[...slug]": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/has multiple dynamic children/);
    });

    test("throws when mixing dynamic and optional catch-all at same level", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[id]": {},
          "/[[...slug]]": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/has multiple dynamic children/);
    });

    test("throws when mixing catch-all and optional catch-all at same level", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...path]": {},
          "/[[...slug]]": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/has multiple dynamic children/);
    });

    test("throws when having three dynamic segments at same level", () => {
      const PA = createPathAtlasClass({
        "/[a]": {},
        "/[b]": {},
        "/[c]": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/has multiple dynamic children.*\/\[a\].*\/\[b\].*\/\[c\]/);
    });

    test("error message includes path for nested violations", () => {
      const PA = createPathAtlasClass({
        "/api": {
          "/v1": {
            "/[id]": {},
            "/[slug]": {},
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment at path "/api/v1" has multiple dynamic children');
    });

    test("allows single dynamic segment alongside static segments", () => {
      const PA = createPathAtlasClass({
        "/products": {
          "/featured": {},
          "/[id]": {},
          "/categories": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });
  });

  describe("translation validation", () => {
    test("throws when translation value is not a string", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: 123,
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment translation "en" must be a string at path "/about"');
    });

    test("throws when translation value is an object", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: { nested: "value" },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment translation "en" must be a string at path "/about"');
    });

    test("throws when translation value is an array", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: ["/about"],
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment translation "en" must be a string at path "/about"');
    });

    test("throws when translation value is null", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: null,
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Segment translation "en" must be a string at path "/about"');
    });

    test("throws when translation value does not start with /", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "about",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Expected
        'Segment translation "en" must match pattern /${string} at path "/about". Got "about"'
      );
    });

    test("throws when translation value is empty string", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Expected
        'Segment translation "en" must match pattern /${string} at path "/about". Got ""'
      );
    });

    test("throws for nested translation without leading slash", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {
            it: "staff",
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Expected
        'Segment translation "it" must match pattern /${string} at path "/about/team". Got "staff"'
      );
    });

    test("accepts valid translation with leading slash", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "/about",
          it: "/chi-siamo",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts translation with single segment value", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });
  });

  describe("single slash validation", () => {
    test("throws when segment key contains multiple slashes", () => {
      const PA = createPathAtlasClass({
        "/about/team": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/". Got "/about/team"'
      );
    });

    test("throws when nested segment key contains multiple slashes", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team/members": {},
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/about". Got "/team/members"'
      );
    });

    test("throws when segment key has trailing slash", () => {
      const PA = createPathAtlasClass({
        "/about/": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/". Got "/about/"'
      );
    });

    test("throws when segment key has multiple consecutive slashes", () => {
      const PA = createPathAtlasClass({
        "/about//team": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/". Got "/about//team"'
      );
    });

    test("throws when translation value contains multiple slashes", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo/info",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment translation "it" must contain only one "/" at the beginning at path "/about". Got "/chi-siamo/info"'
      );
    });

    test("throws when nested translation value contains multiple slashes", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {
            it: "/staff/membri",
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment translation "it" must contain only one "/" at the beginning at path "/about/team". Got "/staff/membri"'
      );
    });

    test("throws when translation value has trailing slash", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo/",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment translation "it" must contain only one "/" at the beginning at path "/about". Got "/chi-siamo/"'
      );
    });

    test("throws when translation value has multiple consecutive slashes", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi//siamo",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment translation "it" must contain only one "/" at the beginning at path "/about". Got "/chi//siamo"'
      );
    });

    test("throws when dynamic segment key contains path", () => {
      const PA = createPathAtlasClass({
        "/users/[id]": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/". Got "/users/[id]"'
      );
    });

    test("throws when catch-all segment key contains path", () => {
      const PA = createPathAtlasClass({
        "/docs/[...slug]": {},
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/". Got "/docs/[...slug]"'
      );
    });

    test("accepts segment key with single leading slash", () => {
      const PA = createPathAtlasClass({
        "/about": {},
        "/contact": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts translation value with single leading slash", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
          fr: "/a-propos",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("throws when root has translations", () => {
      const PA = createPathAtlasClass({
        en: "/",
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Root level segment does not accept translations. Got "en"');
    });
  });

  describe("locale key validation", () => {
    test("accepts valid canonical locale id", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "/about",
          it: "/chi-siamo",
          fr: "/a-propos",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts locale id with region", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "en-US": "/about",
          "en-GB": "/about",
          "pt-BR": "/sobre",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts locale id with script", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "zh-Hans": "/about",
          "zh-Hant": "/about",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("throws on non-canonical locale id with uppercase language", () => {
      const PA = createPathAtlasClass({
        "/about": {
          EN: "/about",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/Invalid translation key "EN" at path "\/about"/);
      expect(() => buildPathAtlas(PA, true)).toThrow(/Did you mean: "en"/);
    });

    test("throws on non-canonical locale id with underscore", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en_US: "/about",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/Invalid translation key "en_US" at path "\/about"/);
      expect(() => buildPathAtlas(PA, true)).toThrow(/Did you mean: "en-US"/);
    });

    test("throws on non-canonical locale id with lowercase region", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "en-us": "/about",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/Invalid translation key "en-us" at path "\/about"/);
      expect(() => buildPathAtlas(PA, true)).toThrow(/Did you mean: "en-US"/);
    });

    test("throws on locale id with wildcard", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "en-*": "/about",
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/Invalid translation key "en-\*" at path "\/about"/);
      expect(() => buildPathAtlas(PA, true)).toThrow(/Wildcards are not allowed/);
    });

    test("throws on nested non-canonical locale id", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "/about",
          "/team": {
            IT: "/staff",
          },
        },
      });
      expect(() => buildPathAtlas(PA, true)).toThrow(/Invalid translation key "IT" at path "\/about\/team"/);
      expect(() => buildPathAtlas(PA, true)).toThrow(/Did you mean: "it"/);
    });
  });

  describe("edge cases", () => {
    test("accepts segment key with special characters", () => {
      const PA = createPathAtlasClass({
        "/about_us": {},
        "/contact.html": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts dynamic segment with underscore in param name", () => {
      const PA = createPathAtlasClass({
        "/[user_id]": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts catch-all with underscore in param name", () => {
      const PA = createPathAtlasClass({
        "/[...path_segments]": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("treats malformed dynamic-like segments as static", () => {
      const PA = createPathAtlasClass({
        "/[incomplete": {},
        "/incomplete]": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("allows multiple malformed dynamic-like segments (treated as static)", () => {
      const PA = createPathAtlasClass({
        "/[a": {},
        "/b]": {},
        "/[c": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });

    test("returns the same instance that was created", () => {
      const decl = { "/about": {} };
      const PA = createPathAtlasClass(decl);
      const atlas = buildPathAtlas(PA, true);
      expect(atlas).toBeInstanceOf(PA);
    });

    test("throws on root-level translations", () => {
      const PA = createPathAtlasClass({
        en: "invalid",
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Root level segment does not accept translations. Got "en"');
    });

    test("throws on root-level valid-looking translations", () => {
      const PA = createPathAtlasClass({
        en: "/",
        it: "/it",
      });
      expect(() => buildPathAtlas(PA, true)).toThrow('Root level segment does not accept translations. Got "en"');
    });
  });

  describe("allowTranslation parameter", () => {
    test("accepts declaration without translations when allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/about": {},
        "/contact": {},
      });
      const atlas = buildPathAtlas(PA, false);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts nested declarations without translations when allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {},
          "/history": {},
        },
      });
      const atlas = buildPathAtlas(PA, false);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts dynamic segments when allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/users": {
          "/[id]": {
            "/profile": {},
          },
        },
      });
      const atlas = buildPathAtlas(PA, false);
      expect(atlas.decl).toBeDefined();
    });

    test("accepts catch-all segments when allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...slug]": {},
        },
      });
      const atlas = buildPathAtlas(PA, false);
      expect(atlas.decl).toBeDefined();
    });

    test("throws when translation found and allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
        },
      });
      expect(() => buildPathAtlas(PA, false)).toThrow(
        'Path translations are not supported by this strategy. Found translation "it" at path "/about"'
      );
    });

    test("throws on nested translation when allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {
            it: "/staff",
          },
        },
      });
      expect(() => buildPathAtlas(PA, false)).toThrow(
        'Path translations are not supported by this strategy. Found translation "it" at path "/about/team"'
      );
    });

    test("throws on multiple translations when allowTranslation is false", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "/about",
          it: "/chi-siamo",
          fr: "/a-propos",
        },
      });
      expect(() => buildPathAtlas(PA, false)).toThrow(
        'Path translations are not supported by this strategy. Found translation "en" at path "/about"'
      );
    });

    test("accepts translations when allowTranslation is true", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
          fr: "/a-propos",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.decl).toBeDefined();
    });
  });

  describe("containsTranslations property", () => {
    test("returns false for empty declaration", () => {
      const PA = createPathAtlasClass({});
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(false);
    });

    test("returns false for declaration with only static segments", () => {
      const PA = createPathAtlasClass({
        "/about": {},
        "/contact": {},
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(false);
    });

    test("returns false for declaration with nested static segments", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {},
          "/history": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(false);
    });

    test("returns false for declaration with dynamic segments only", () => {
      const PA = createPathAtlasClass({
        "/users": {
          "/[id]": {
            "/profile": {},
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(false);
    });

    test("returns false for declaration with catch-all segments only", () => {
      const PA = createPathAtlasClass({
        "/docs": {
          "/[...slug]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(false);
    });

    test("returns true for declaration with single translation", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(true);
    });

    test("returns true for declaration with multiple translations", () => {
      const PA = createPathAtlasClass({
        "/about": {
          en: "/about",
          it: "/chi-siamo",
          fr: "/a-propos",
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(true);
    });

    test("returns true for declaration with nested translation", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {
            it: "/staff",
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(true);
    });

    test("returns true for declaration with deeply nested translation", () => {
      const PA = createPathAtlasClass({
        "/api": {
          "/v1": {
            "/users": {
              "/profile": {
                it: "/profilo",
              },
            },
          },
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(true);
    });

    test("returns true for complex declaration with translations", () => {
      const PA = createPathAtlasClass({
        "/about": {
          it: "/chi-siamo",
          "/team": {
            it: "/staff",
          },
        },
        "/products": {
          "/[id]": {},
        },
        "/docs": {
          "/[...slug]": {},
        },
      });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas.containsTranslations).toBe(true);
    });

    test("returns false when allowTranslation is false and no translations present", () => {
      const PA = createPathAtlasClass({
        "/about": {
          "/team": {},
        },
      });
      const atlas = buildPathAtlas(PA, false);
      expect(atlas.containsTranslations).toBe(false);
    });

    test("returns ExtendedPathAtlas type with containsTranslations", () => {
      const PA = createPathAtlasClass({ "/about": {} });
      const atlas: ExtendedPathAtlas<AnyPathAtlas> = buildPathAtlas(PA, true);
      expect(atlas).toHaveProperty("containsTranslations");
      expect(atlas).toHaveProperty("decl");
    });

    test("preserves original PathAtlas instance properties", () => {
      const decl = { "/about": { it: "/chi-siamo" } };
      const PA = createPathAtlasClass(decl);
      const atlas = buildPathAtlas(PA, true);
      expect(atlas).toBeInstanceOf(PA);
      expect(atlas.decl).toEqual(decl);
      expect(atlas.containsTranslations).toBe(true);
    });
  });
});

import { describe, expect, it } from "vitest";
import type { AnyPathAtlas } from "../../src/core/path-atlas.js";
import { buildPathAtlas } from "../../src/core/path-atlas.js";

function createPathAtlasClass(decl: object): new () => AnyPathAtlas {
  return class {
    readonly decl = decl;
  };
}

function build(decl: object, allowTranslation = true) {
  return buildPathAtlas(createPathAtlasClass(decl), allowTranslation);
}

describe("buildPathAtlas", () => {
  describe("valid declarations", () => {
    it.each([
      ["empty declaration", {}],
      ["simple static segment", { "/about": {} }],
      ["nested static segments", { "/about": { "/team": {}, "/history": {} } }],
      ["deeply nested segments", { "/api": { "/v1": { "/users": { "/profile": {} } } } }],
      ["dynamic segment", { "/users": { "/[id]": {} } }],
      ["catch-all segment", { "/docs": { "/[...slug]": {} } }],
      ["optional catch-all segment", { "/docs": { "/[[...slug]]": {} } }],
      ["segment with locale translations", { "/about": { en: "/about", it: "/chi-siamo", fr: "/a-propos" } }],
      ["translations and child segments", { "/about": { it: "/chi-siamo", "/team": { it: "/staff" } } }],
      ["mixed static and dynamic children", { "/products": { "/featured": {}, "/[id]": {} } }],
      ["dynamic segment at root level", { "/[slug]": {} }],
      ["nested dynamic segments at different levels", { "/[category]": { "/[productId]": { "/[variant]": {} } } }],
      [
        "complex real-world structure",
        {
          "/about": { it: "/chi-siamo", "/team": { it: "/staff" }, "/contact": {} },
          "/products": { it: "/prodotti", "/[id]": { "/reviews": { it: "/recensioni" } } },
          "/docs": { "/[...slug]": {} },
        },
      ],
      ["hyphenated segment names", { "/about-us": {}, "/contact-form": {} }],
      ["numeric characters in segments", { "/v1": { "/api2": {} } }],
      ["special characters in segment key", { "/about_us": {}, "/contact.html": {} }],
      ["dynamic segment with underscore", { "/[user_id]": {} }],
      ["catch-all with underscore", { "/[...path_segments]": {} }],
      ["dynamic segment with child segments only", { "/users": { "/[id]": { "/profile": {}, "/settings": {} } } }],
      [
        "single dynamic alongside static segments",
        { "/products": { "/featured": {}, "/[id]": {}, "/categories": {} } },
      ],
    ])("accepts %s", (_name, decl) => {
      expect(() => build(decl)).not.toThrow();
    });

    it("reports correct number of top-level segments", () => {
      const atlas = build({ "/about": {}, "/contact": {}, "/products": {} });
      expect(Object.keys(atlas.decl)).toHaveLength(3);
    });
  });

  describe("invalid segment declarations", () => {
    it.each([
      ["at root", { "/": {} }, "/"],
      ["nested under /about", { "/about": { "/": {} } }, "/about"],
    ])("throws on empty segment key %s", (_name, decl, path) => {
      expect(() => build(decl)).toThrow(`Invalid empty segment key at path "${path}"`);
    });

    it.each([
      ["null", null],
      ["a string", "invalid"],
      ["a number", 123],
      ["undefined", undefined],
    ])("throws when segment value is %s", (_type, value) => {
      expect(() => build({ "/about": value })).toThrow('Segment declarations must be objects at path "/about"');
    });

    it("throws when nested segment value is not an object", () => {
      expect(() => build({ "/about": { "/team": "invalid" } })).toThrow(
        'Segment declarations must be objects at path "/about/team"'
      );
    });
  });

  describe("catch-all segment validation", () => {
    it.each([
      ["has static child", { "/docs": { "/[...slug]": { "/child": {} } } }, "/docs/[...slug]"],
      ["optional has static child", { "/docs": { "/[[...slug]]": { "/child": {} } } }, "/docs/[[...slug]]"],
      ["has dynamic child", { "/[...path]": { "/[id]": {} } }, "/[...path]"],
      ["has deeply nested child", { "/docs": { "/[...slug]": { "/nested": { "/deep": {} } } } }, "/docs/[...slug]"],
    ])("throws when catch-all %s", (_name, decl, path) => {
      expect(() => build(decl)).toThrow(
        `Catch-all segment declarations must not have child segments at path "${path}"`
      );
    });
  });

  describe("dynamic segment translation validation", () => {
    it.each([
      ["dynamic segment", { "/users": { "/[id]": { it: "/utente" } } }, "/users/[id]", '"it"'],
      ["catch-all segment", { "/docs": { "/[...slug]": { it: "/percorso" } } }, "/docs/[...slug]", '"it"'],
      ["optional catch-all", { "/docs": { "/[[...slug]]": { it: "/percorso" } } }, "/docs/[[...slug]]", '"it"'],
      [
        "dynamic with multiple translations",
        { "/[id]": { en: "/id", it: "/identificatore", fr: "/identifiant" } },
        "/[id]",
        '"en", "it", "fr"',
      ],
      [
        "nested dynamic",
        { "/products": { it: "/prodotti", "/[category]": { "/[id]": { it: "/identificatore" } } } },
        "/products/[category]/[id]",
        '"it"',
      ],
    ])("throws when %s has translation", (_name, decl, path, keys) => {
      expect(() => build(decl)).toThrow(`Dynamic segments do not accept translations at path "${path}". Got ${keys}`);
    });
  });

  describe("multiple dynamic children validation", () => {
    it.each([
      ["at root level", { "/[id]": {}, "/[slug]": {} }],
      ["at nested level", { "/products": { "/[id]": {}, "/[sku]": {} } }],
      ["mixing dynamic and catch-all", { "/docs": { "/[id]": {}, "/[...slug]": {} } }],
      ["mixing dynamic and optional catch-all", { "/docs": { "/[id]": {}, "/[[...slug]]": {} } }],
      ["mixing catch-all variants", { "/docs": { "/[...path]": {}, "/[[...slug]]": {} } }],
      ["three dynamic segments", { "/[a]": {}, "/[b]": {}, "/[c]": {} }],
    ])("throws when %s", (_name, decl) => {
      expect(() => build(decl)).toThrow(/has multiple dynamic children/);
    });

    it("includes segment names in error message", () => {
      expect(() => build({ "/[a]": {}, "/[b]": {}, "/[c]": {} })).toThrow(
        /has multiple dynamic children.*\/\[a\].*\/\[b\].*\/\[c\]/
      );
    });

    it("includes path for nested violations", () => {
      expect(() => build({ "/api": { "/v1": { "/[id]": {}, "/[slug]": {} } } })).toThrow(
        'Segment at path "/api/v1" has multiple dynamic children'
      );
    });
  });

  describe("translation validation", () => {
    it.each([
      ["a number", 123],
      ["an object", { nested: "value" }],
      ["an array", ["/about"]],
      ["null", null],
    ])("throws when translation value is %s", (_type, value) => {
      expect(() => build({ "/about": { en: value } })).toThrow(
        'Segment translation "en" must be a string at path "/about"'
      );
    });

    it("throws when translation value does not start with /", () => {
      expect(() => build({ "/about": { en: "about" } })).toThrow(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Expected
        'Segment translation "en" must match pattern /${string} at path "/about". Got "about"'
      );
    });

    it("throws when translation value is empty string", () => {
      expect(() => build({ "/about": { en: "" } })).toThrow(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Expected
        'Segment translation "en" must match pattern /${string} at path "/about". Got ""'
      );
    });

    it("throws for nested translation without leading slash", () => {
      expect(() => build({ "/about": { "/team": { it: "staff" } } })).toThrow(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: Expected
        'Segment translation "it" must match pattern /${string} at path "/about/team". Got "staff"'
      );
    });

    it("throws when root has translations", () => {
      expect(() => build({ en: "/" })).toThrow('Root level segment does not accept translations. Got "en"');
    });
  });

  describe("single slash validation", () => {
    it.each([
      ["with path separator", "/about/team"],
      ["with trailing slash", "/about/"],
      ["with consecutive slashes", "/about//team"],
      ["dynamic with path", "/users/[id]"],
      ["catch-all with path", "/docs/[...slug]"],
    ])("throws when segment key %s", (_name, key) => {
      expect(() => build({ [key]: {} })).toThrow(
        `Segment key must contain only one "/" at the beginning at path "/". Got "${key}"`
      );
    });

    it("throws when nested segment key has multiple slashes", () => {
      expect(() => build({ "/about": { "/team/members": {} } })).toThrow(
        'Segment key must contain only one "/" at the beginning at path "/about". Got "/team/members"'
      );
    });

    it.each([
      ["with multiple segments", "/chi-siamo/info"],
      ["with trailing slash", "/chi-siamo/"],
      ["with consecutive slashes", "/chi//siamo"],
    ])("throws when translation value %s", (_name, value) => {
      expect(() => build({ "/about": { it: value } })).toThrow(
        `Segment translation "it" must contain only one "/" at the beginning at path "/about". Got "${value}"`
      );
    });

    it("throws when nested translation value has multiple slashes", () => {
      expect(() => build({ "/about": { "/team": { it: "/staff/membri" } } })).toThrow(
        'Segment translation "it" must contain only one "/" at the beginning at path "/about/team". Got "/staff/membri"'
      );
    });
  });

  describe("locale key validation", () => {
    it.each([
      ["canonical locale id", { en: "/about", it: "/chi-siamo", fr: "/a-propos" }],
      ["locale with region", { "en-US": "/about", "en-GB": "/about", "pt-BR": "/sobre" }],
      ["locale with script", { "zh-Hans": "/about", "zh-Hant": "/about" }],
    ])("accepts %s", (_name, translations) => {
      expect(() => build({ "/about": translations })).not.toThrow();
    });

    it("throws on non-canonical locale with uppercase language", () => {
      expect(() => build({ "/about": { EN: "/about" } })).toThrow(/Invalid translation key "EN" at path "\/about"/);
      expect(() => build({ "/about": { EN: "/about" } })).toThrow(/Did you mean: "en"/);
    });

    it("throws on non-canonical locale with underscore", () => {
      expect(() => build({ "/about": { en_US: "/about" } })).toThrow(
        /Invalid translation key "en_US" at path "\/about"/
      );
      expect(() => build({ "/about": { en_US: "/about" } })).toThrow(/Did you mean: "en-US"/);
    });

    it("throws on non-canonical locale with lowercase region", () => {
      expect(() => build({ "/about": { "en-us": "/about" } })).toThrow(
        /Invalid translation key "en-us" at path "\/about"/
      );
      expect(() => build({ "/about": { "en-us": "/about" } })).toThrow(/Did you mean: "en-US"/);
    });

    it("throws on locale with wildcard", () => {
      expect(() => build({ "/about": { "en-*": "/about" } })).toThrow(
        /Invalid translation key "en-\*" at path "\/about"/
      );
      expect(() => build({ "/about": { "en-*": "/about" } })).toThrow(/Wildcards are not allowed/);
    });

    it("throws on nested non-canonical locale", () => {
      expect(() => build({ "/about": { en: "/about", "/team": { IT: "/staff" } } })).toThrow(
        /Invalid translation key "IT" at path "\/about\/team"/
      );
      expect(() => build({ "/about": { en: "/about", "/team": { IT: "/staff" } } })).toThrow(/Did you mean: "it"/);
    });
  });

  describe("edge cases", () => {
    it("treats malformed dynamic-like segments as static", () => {
      const atlas = build({ "/[incomplete": {}, "/incomplete]": {} });
      expect(Object.keys(atlas.decl)).toHaveLength(2);
    });

    it("returns the same instance that was created", () => {
      const PA = createPathAtlasClass({ "/about": {} });
      const atlas = buildPathAtlas(PA, true);
      expect(atlas).toBeInstanceOf(PA);
    });
  });

  describe("allowTranslation parameter", () => {
    it("accepts declaration without translations when allowTranslation is false", () => {
      expect(() => build({ "/about": {}, "/contact": {} }, false)).not.toThrow();
    });

    it("throws when translation found and allowTranslation is false", () => {
      expect(() => build({ "/about": { it: "/chi-siamo" } }, false)).toThrow(
        'Path translations are not supported by this strategy. Found translation "it" at path "/about"'
      );
    });

    it("throws on nested translation when allowTranslation is false", () => {
      expect(() => build({ "/about": { "/team": { it: "/staff" } } }, false)).toThrow(
        'Path translations are not supported by this strategy. Found translation "it" at path "/about/team"'
      );
    });

    it("throws on multiple translations when allowTranslation is false", () => {
      expect(() => build({ "/about": { en: "/about", it: "/chi-siamo", fr: "/a-propos" } }, false)).toThrow(
        'Path translations are not supported by this strategy. Found translation "en" at path "/about"'
      );
    });

    it("accepts translations when allowTranslation is true", () => {
      expect(() => build({ "/about": { it: "/chi-siamo", fr: "/a-propos" } })).not.toThrow();
    });
  });

  describe("containsTranslations", () => {
    it.each([
      ["empty declaration", {}],
      ["static segments only", { "/about": {}, "/contact": {} }],
      ["nested static segments", { "/about": { "/team": {}, "/history": {} } }],
      ["dynamic segments only", { "/users": { "/[id]": { "/profile": {} } } }],
      ["catch-all segments only", { "/docs": { "/[...slug]": {} } }],
    ])("is false for %s", (_name, decl) => {
      expect(build(decl).containsTranslations).toBe(false);
    });

    it.each([
      ["single translation", { "/about": { it: "/chi-siamo" } }],
      ["multiple translations", { "/about": { en: "/about", it: "/chi-siamo", fr: "/a-propos" } }],
      ["nested translation", { "/about": { "/team": { it: "/staff" } } }],
      ["deeply nested translation", { "/api": { "/v1": { "/users": { "/profile": { it: "/profilo" } } } } }],
      [
        "complex declaration with translations",
        {
          "/about": { it: "/chi-siamo", "/team": { it: "/staff" } },
          "/products": { "/[id]": {} },
          "/docs": { "/[...slug]": {} },
        },
      ],
    ])("is true for %s", (_name, decl) => {
      expect(build(decl).containsTranslations).toBe(true);
    });

    it("is false when allowTranslation is false and no translations present", () => {
      expect(build({ "/about": { "/team": {} } }, false).containsTranslations).toBe(false);
    });

    it("preserves original PathAtlas instance properties", () => {
      const decl = { "/about": { it: "/chi-siamo" } };
      const PA = createPathAtlasClass(decl);
      const atlas = buildPathAtlas(PA, true);
      expect(atlas).toBeInstanceOf(PA);
      expect(atlas.decl).toEqual(decl);
      expect(atlas.containsTranslations).toBe(true);
    });
  });
});

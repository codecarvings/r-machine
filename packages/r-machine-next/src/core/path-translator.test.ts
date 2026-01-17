import { describe, expect, test } from "vitest";
import { buildPathAtlasSegmentTree, getSegmentData, getTranslatedPath, PathTranslator } from "./path-translator.js";

describe("getSegmentData", () => {
  test("returns undefined kind for empty string", () => {
    const result = getSegmentData("");
    expect(result.kind).toBeUndefined();
    expect(result.paramKey).toBeUndefined();
  });

  test("parses static segment", () => {
    const result = getSegmentData("about");
    expect(result.kind).toBe("static");
    expect(result.paramKey).toBeUndefined();
  });

  test("parses dynamic segment", () => {
    const result = getSegmentData("[slug]");
    expect(result.kind).toBe("dynamic");
    expect(result.paramKey).toBe("slug");
  });

  test("parses catch-all segment", () => {
    const result = getSegmentData("[...path]");
    expect(result.kind).toBe("catchAll");
    expect(result.paramKey).toBe("path");
  });

  test("parses optional catch-all segment", () => {
    const result = getSegmentData("[[...path]]");
    expect(result.kind).toBe("optionalCatchAll");
    expect(result.paramKey).toBe("path");
  });

  test("treats malformed segments as static when not matching patterns", () => {
    expect(getSegmentData("[incomplete").kind).toBe("static");
    expect(getSegmentData("incomplete]").kind).toBe("static");
    expect(getSegmentData("[...incomplete").kind).toBe("static");
    expect(getSegmentData("[[...incomplete").kind).toBe("static");
  });
});

describe("buildPathAtlasSegmentTree", () => {
  const locales = ["en", "it", "fr"];
  const defaultLocale = "en";

  test("builds tree with translations for each locale", () => {
    const decl = {};
    const tree = buildPathAtlasSegmentTree("about", decl, locales, defaultLocale);

    expect(tree.kind).toBe("static");
    expect(tree.paramKey).toBeUndefined();
    expect(tree.translations).toEqual({
      en: "about",
      it: "about",
      fr: "about",
    });
    expect(tree.children).toEqual({});
  });

  test("builds tree with locale-specific translations", () => {
    const decl = {
      it: "/chi-siamo",
      fr: "/apropos",
    };
    const tree = buildPathAtlasSegmentTree("about", decl, locales, defaultLocale);

    expect(tree.translations).toEqual({
      en: "about",
      it: "chi-siamo",
      fr: "apropos",
    });
  });

  test("builds tree with child segments", () => {
    const decl = {
      "/team": {
        it: "/staff",
      },
      "/contact": {},
    };
    const tree = buildPathAtlasSegmentTree("about", decl, locales, defaultLocale);

    expect(tree.children).toHaveProperty("team");
    expect(tree.children).toHaveProperty("contact");
    expect(tree.children.team.translations.it).toBe("staff");
    expect(tree.children.contact.translations.en).toBe("contact");
  });

  test("builds tree with dynamic segments", () => {
    const decl = {
      "/[id]": {},
    };
    const tree = buildPathAtlasSegmentTree("products", decl, locales, defaultLocale);

    expect(tree.children["[id]"].kind).toBe("dynamic");
    expect(tree.children["[id]"].paramKey).toBe("id");
  });

  test("builds nested tree structure", () => {
    const decl = {
      "/products": {
        it: "/prodotti",
        "/[id]": {
          "/reviews": {
            it: "/recensioni",
          },
        },
      },
    };
    const tree = buildPathAtlasSegmentTree("", decl, locales, defaultLocale);

    expect(tree.children.products.translations.it).toBe("prodotti");
    expect(tree.children.products.children["[id]"].kind).toBe("dynamic");
    expect(tree.children.products.children["[id]"].children.reviews.translations.it).toBe("recensioni");
  });

  test("builds root segment with undefined kind", () => {
    const decl = {};
    const tree = buildPathAtlasSegmentTree("", decl, locales, defaultLocale);

    expect(tree.kind).toBeUndefined();
    expect(tree.paramKey).toBeUndefined();
    expect(tree.translations).toEqual({ en: "", it: "", fr: "" });
  });

  test("builds tree with catch-all segment", () => {
    const decl = {
      "/[...slug]": {},
    };
    const tree = buildPathAtlasSegmentTree("docs", decl, locales, defaultLocale);

    expect(tree.children["[...slug]"].kind).toBe("catchAll");
    expect(tree.children["[...slug]"].paramKey).toBe("slug");
  });

  test("builds tree with optional catch-all segment", () => {
    const decl = {
      "/[[...path]]": {},
    };
    const tree = buildPathAtlasSegmentTree("docs", decl, locales, defaultLocale);

    expect(tree.children["[[...path]]"].kind).toBe("optionalCatchAll");
    expect(tree.children["[[...path]]"].paramKey).toBe("path");
  });

  test("builds tree with mixed static and dynamic children", () => {
    const decl = {
      "/overview": { it: "/panoramica" },
      "/[id]": {},
      "/settings": { it: "/impostazioni" },
    };
    const tree = buildPathAtlasSegmentTree("account", decl, locales, defaultLocale);

    expect(Object.keys(tree.children)).toHaveLength(3);
    expect(tree.children.overview.kind).toBe("static");
    expect(tree.children.overview.translations.it).toBe("panoramica");
    expect(tree.children["[id]"].kind).toBe("dynamic");
    expect(tree.children["[id]"].paramKey).toBe("id");
    expect(tree.children.settings.kind).toBe("static");
    expect(tree.children.settings.translations.it).toBe("impostazioni");
  });

  test("builds deeply nested tree (4 levels)", () => {
    const decl = {
      "/api": {
        "/v1": {
          "/users": {
            it: "/utenti",
            "/[id]": {
              "/profile": {
                it: "/profilo",
              },
            },
          },
        },
      },
    };
    const tree = buildPathAtlasSegmentTree("", decl, locales, defaultLocale);

    const profile = tree.children.api.children.v1.children.users.children["[id]"].children.profile;
    expect(profile.kind).toBe("static");
    expect(profile.translations.it).toBe("profilo");
    expect(profile.translations.en).toBe("profile");
  });

  test("builds tree with partial locale translations", () => {
    const decl = {
      it: "/contatti",
    };
    const tree = buildPathAtlasSegmentTree("contact", decl, locales, defaultLocale);

    expect(tree.translations.en).toBe("contact");
    expect(tree.translations.it).toBe("contatti");
    expect(tree.translations.fr).toBe("contact");
  });

  test("builds tree with both translations and children on same segment", () => {
    const decl = {
      it: "/blog",
      fr: "/blogue",
      "/[slug]": {},
      "/categories": {
        it: "/categorie",
      },
    };
    const tree = buildPathAtlasSegmentTree("blog", decl, locales, defaultLocale);

    expect(tree.translations.en).toBe("blog");
    expect(tree.translations.it).toBe("blog");
    expect(tree.translations.fr).toBe("blogue");
    expect(tree.children["[slug]"].kind).toBe("dynamic");
    expect(tree.children.categories.translations.it).toBe("categorie");
  });

  test("builds tree with multiple dynamic segments at different levels", () => {
    const decl = {
      "/[category]": {
        "/[productId]": {
          "/[variant]": {},
        },
      },
    };
    const tree = buildPathAtlasSegmentTree("shop", decl, locales, defaultLocale);

    expect(tree.children["[category]"].kind).toBe("dynamic");
    expect(tree.children["[category]"].paramKey).toBe("category");
    expect(tree.children["[category]"].children["[productId]"].kind).toBe("dynamic");
    expect(tree.children["[category]"].children["[productId]"].paramKey).toBe("productId");
    expect(tree.children["[category]"].children["[productId]"].children["[variant]"].kind).toBe("dynamic");
    expect(tree.children["[category]"].children["[productId]"].children["[variant]"].paramKey).toBe("variant");
  });

  test("preserves segment name in translations for all locales by default", () => {
    const decl = {
      "/special-page": {},
    };
    const tree = buildPathAtlasSegmentTree("root", decl, locales, defaultLocale);

    expect(tree.children["special-page"].translations).toEqual({
      en: "special-page",
      it: "special-page",
      fr: "special-page",
    });
  });

  test("handles single locale configuration", () => {
    const singleLocale = ["en"];
    const tree = buildPathAtlasSegmentTree("about", {}, singleLocale, "en");

    expect(tree.translations).toEqual({ en: "about" });
  });

  test("builds tree with catch-all containing translations", () => {
    const decl = {
      "/[...path]": {
        "/end": {
          it: "/fine",
        },
      },
    };
    const tree = buildPathAtlasSegmentTree("docs", decl, locales, defaultLocale);

    expect(tree.children["[...path]"].kind).toBe("catchAll");
    expect(tree.children["[...path]"].children.end.translations.it).toBe("fine");
  });
});

describe("getTranslatedPath", () => {
  test("returns path with static segments", () => {
    const mappedSegments = [
      { decl: true, segment: "about", kind: "static" as const },
      { decl: true, segment: "team", kind: "static" as const },
    ];
    const result = getTranslatedPath("en", "/about/team", mappedSegments);
    expect(result).toBe("/about/team");
  });

  test("substitutes dynamic segment with param value", () => {
    const mappedSegments = [
      { decl: true, segment: "products", kind: "static" as const },
      { decl: true, segment: "id", kind: "dynamic" as const },
    ];
    const result = getTranslatedPath("en", "/products/[id]", mappedSegments, { id: "123" });
    expect(result).toBe("/products/123");
  });

  test("encodes param values", () => {
    const mappedSegments = [{ decl: true, segment: "query", kind: "dynamic" as const }];
    const result = getTranslatedPath("en", "/[query]", mappedSegments, { query: "hello world" });
    expect(result).toBe("/hello%20world");
  });

  test("substitutes catch-all segment with array values", () => {
    const mappedSegments = [
      { decl: true, segment: "docs", kind: "static" as const },
      { decl: true, segment: "path", kind: "catchAll" as const },
    ];
    const result = getTranslatedPath("en", "/docs/[...path]", mappedSegments, {
      path: ["getting-started", "installation"],
    });
    expect(result).toBe("/docs/getting-started/installation");
  });

  test("substitutes optional catch-all segment with array values", () => {
    const mappedSegments = [
      { decl: true, segment: "docs", kind: "static" as const },
      { decl: true, segment: "path", kind: "optionalCatchAll" as const },
    ];
    const result = getTranslatedPath("en", "/docs/[[...path]]", mappedSegments, {
      path: ["intro"],
    });
    expect(result).toBe("/docs/intro");
  });

  test("throws error when dynamic param is missing", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedPath("en", "/[id]", mappedSegments, {})).toThrow('parameter "id" is missing');
  });

  test("throws error when catch-all param is not an array", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    expect(() => getTranslatedPath("en", "/[...path]", mappedSegments, { path: "not-array" })).toThrow(
      'parameter "path" is expected to be an array'
    );
  });

  test("throws error when param value results in empty segment", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedPath("en", "/[id]", mappedSegments, { id: "" })).toThrow("empty path segment");
  });

  test("returns root path for empty mapped segments", () => {
    const result = getTranslatedPath("en", "/", []);
    expect(result).toBe("/");
  });

  test("handles single static segment", () => {
    const mappedSegments = [{ decl: true, segment: "home", kind: "static" as const }];
    const result = getTranslatedPath("en", "/home", mappedSegments);
    expect(result).toBe("/home");
  });

  test("handles multiple dynamic segments", () => {
    const mappedSegments = [
      { decl: true, segment: "category", kind: "dynamic" as const },
      { decl: true, segment: "productId", kind: "dynamic" as const },
      { decl: true, segment: "variant", kind: "dynamic" as const },
    ];
    const result = getTranslatedPath("en", "/[category]/[productId]/[variant]", mappedSegments, {
      category: "electronics",
      productId: "phone-123",
      variant: "black",
    });
    expect(result).toBe("/electronics/phone-123/black");
  });

  test("handles mixed static and dynamic segments in various orders", () => {
    const mappedSegments = [
      { decl: true, segment: "shop", kind: "static" as const },
      { decl: true, segment: "category", kind: "dynamic" as const },
      { decl: true, segment: "items", kind: "static" as const },
      { decl: true, segment: "id", kind: "dynamic" as const },
    ];
    const result = getTranslatedPath("en", "/shop/[category]/items/[id]", mappedSegments, {
      category: "books",
      id: "42",
    });
    expect(result).toBe("/shop/books/items/42");
  });

  test("converts numeric param values to string", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    const result = getTranslatedPath("en", "/[id]", mappedSegments, { id: 12345 });
    expect(result).toBe("/12345");
  });

  test("encodes special URL characters in param values", () => {
    const mappedSegments = [{ decl: true, segment: "query", kind: "dynamic" as const }];

    expect(getTranslatedPath("en", "/[query]", mappedSegments, { query: "a/b" })).toBe("/a%2Fb");
    expect(getTranslatedPath("en", "/[query]", mappedSegments, { query: "a?b=c" })).toBe("/a%3Fb%3Dc");
    expect(getTranslatedPath("en", "/[query]", mappedSegments, { query: "a#section" })).toBe("/a%23section");
    expect(getTranslatedPath("en", "/[query]", mappedSegments, { query: "a&b=1" })).toBe("/a%26b%3D1");
  });

  test("encodes unicode characters in param values", () => {
    const mappedSegments = [{ decl: true, segment: "name", kind: "dynamic" as const }];
    const result = getTranslatedPath("it", "/[name]", mappedSegments, { name: "caffè" });
    expect(result).toBe("/caff%C3%A8");
  });

  test("handles catch-all with single element array", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    const result = getTranslatedPath("en", "/[...path]", mappedSegments, { path: ["single"] });
    expect(result).toBe("/single");
  });

  test("handles catch-all with many elements", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    const result = getTranslatedPath("en", "/[...path]", mappedSegments, {
      path: ["a", "b", "c", "d", "e"],
    });
    expect(result).toBe("/a/b/c/d/e");
  });

  test("encodes values in catch-all arrays", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    const result = getTranslatedPath("en", "/[...path]", mappedSegments, {
      path: ["hello world", "foo/bar"],
    });
    expect(result).toBe("/hello%20world/foo%2Fbar");
  });

  test("converts numeric values in catch-all arrays to strings", () => {
    const mappedSegments = [{ decl: true, segment: "ids", kind: "catchAll" as const }];
    const result = getTranslatedPath("en", "/[...ids]", mappedSegments, {
      ids: [1, 2, 3],
    });
    expect(result).toBe("/1/2/3");
  });

  test("throws error when params object is undefined for dynamic segment", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedPath("en", "/[id]", mappedSegments, undefined)).toThrow('parameter "id" is missing');
  });

  test("throws error when catch-all array contains empty string", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    expect(() => getTranslatedPath("en", "/[...path]", mappedSegments, { path: ["valid", ""] })).toThrow(
      "empty path segment"
    );
  });

  test("error message includes locale and path info", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedPath("it", "/users/[id]", mappedSegments, {})).toThrow(
      'Cannot translate path "/users/[id]" for locale "it"'
    );
  });

  test("handles optional catch-all same as regular catch-all", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "optionalCatchAll" as const }];
    const result = getTranslatedPath("en", "/[[...path]]", mappedSegments, {
      path: ["a", "b"],
    });
    expect(result).toBe("/a/b");
  });

  test("throws error when optional catch-all param is not an array", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "optionalCatchAll" as const }];
    expect(() => getTranslatedPath("en", "/[[...path]]", mappedSegments, { path: "not-array" })).toThrow(
      'parameter "path" is expected to be an array'
    );
  });

  test("handles static segment after dynamic segment", () => {
    const mappedSegments = [
      { decl: true, segment: "id", kind: "dynamic" as const },
      { decl: true, segment: "edit", kind: "static" as const },
    ];
    const result = getTranslatedPath("en", "/[id]/edit", mappedSegments, { id: "123" });
    expect(result).toBe("/123/edit");
  });

  test("handles deeply nested path with all segment types", () => {
    const mappedSegments = [
      { decl: true, segment: "api", kind: "static" as const },
      { decl: true, segment: "version", kind: "dynamic" as const },
      { decl: true, segment: "resources", kind: "static" as const },
      { decl: true, segment: "path", kind: "catchAll" as const },
    ];
    const result = getTranslatedPath("en", "/api/[version]/resources/[...path]", mappedSegments, {
      version: "v2",
      path: ["users", "123", "posts"],
    });
    expect(result).toBe("/api/v2/resources/users/123/posts");
  });

  test("preserves param value case sensitivity", () => {
    const mappedSegments = [{ decl: true, segment: "name", kind: "dynamic" as const }];
    const result = getTranslatedPath("en", "/[name]", mappedSegments, { name: "CamelCase" });
    expect(result).toBe("/CamelCase");
  });
});

describe("PathTranslator", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  function createMockAtlas(decl: object) {
    return { decl };
  }

  test("translates root path", () => {
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/", {})).toBe("/");
    expect(translator.getTranslatedPath("it", "/", {})).toBe("/");
  });

  test("translates simple static path", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/about", {})).toBe("/about");
    expect(translator.getTranslatedPath("it", "/about", {})).toBe("/chi-siamo");
  });

  test("translates nested static path", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
        "/team": {
          it: "/staff",
        },
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/about/team", {})).toBe("/about/team");
    expect(translator.getTranslatedPath("it", "/about/team", {})).toBe("/chi-siamo/staff");
  });

  test("translates path with dynamic segment", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/products/[id]", { id: "123" })).toBe("/products/123");
    expect(translator.getTranslatedPath("it", "/products/[id]", { id: "456" })).toBe("/prodotti/456");
  });

  test("translates path with catch-all segment", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/docs/[...slug]", { slug: ["intro", "getting-started"] })).toBe(
      "/docs/intro/getting-started"
    );
    expect(translator.getTranslatedPath("it", "/docs/[...slug]", { slug: ["guida"] })).toBe("/documenti/guida");
  });

  test("handles undeclared path segments as-is", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/about/unknown", {})).toBe("/about/unknown");
    expect(translator.getTranslatedPath("it", "/about/unknown", {})).toBe("/chi-siamo/unknown");
  });

  test("handles completely undeclared path", () => {
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/unknown/path", {})).toBe("/unknown/path");
  });

  test("handles undeclared dynamic segment in path", () => {
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/users/[id]", { id: "42" })).toBe("/users/42");
  });

  test("caches declared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    translator.getTranslatedPath("en", "/about", {});
    translator.getTranslatedPath("en", "/about", {});

    const cache = (translator as any).caches.en;
    expect(cache.has("/about")).toBe(true);
  });

  test("does not cache undeclared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    translator.getTranslatedPath("en", "/about/unknown", {});

    const cache = (translator as any).caches.en;
    expect(cache.has("/about/unknown")).toBe(false);
  });

  test("works with multiple locales", () => {
    const multiLocales = ["en", "it", "fr", "de"];
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
        fr: "/a-propos",
        de: "/uber-uns",
      },
    });
    const translator = new PathTranslator(atlas, multiLocales, "en");

    expect(translator.getTranslatedPath("en", "/about", {})).toBe("/about");
    expect(translator.getTranslatedPath("it", "/about", {})).toBe("/chi-siamo");
    expect(translator.getTranslatedPath("fr", "/about", {})).toBe("/a-propos");
    expect(translator.getTranslatedPath("de", "/about", {})).toBe("/uber-uns");
  });

  test("translates path with optional catch-all segment", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[[...slug]]": {},
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/docs/[[...slug]]", { slug: ["guide"] })).toBe("/docs/guide");
    expect(translator.getTranslatedPath("it", "/docs/[[...slug]]", { slug: ["guida", "intro"] })).toBe(
      "/documenti/guida/intro"
    );
  });

  test("isolates cache between different locales", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    translator.getTranslatedPath("en", "/about", {});
    translator.getTranslatedPath("it", "/about", {});

    const enCache = (translator as any).caches.en;
    const itCache = (translator as any).caches.it;

    expect(enCache.has("/about")).toBe(true);
    expect(itCache.has("/about")).toBe(true);
    expect(enCache).not.toBe(itCache);
  });

  test("translates deeply nested path (4 levels)", () => {
    const atlas = createMockAtlas({
      "/api": {
        "/v1": {
          "/users": {
            it: "/utenti",
            "/[id]": {
              "/profile": {
                it: "/profilo",
              },
            },
          },
        },
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/api/v1/users/[id]/profile", { id: "123" })).toBe(
      "/api/v1/users/123/profile"
    );
    expect(translator.getTranslatedPath("it", "/api/v1/users/[id]/profile", { id: "456" })).toBe(
      "/api/v1/utenti/456/profilo"
    );
  });

  test("handles multiple dynamic segments in declared path", () => {
    const atlas = createMockAtlas({
      "/shop": {
        it: "/negozio",
        "/[category]": {
          "/[productId]": {},
        },
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(
      translator.getTranslatedPath("en", "/shop/[category]/[productId]", {
        category: "electronics",
        productId: "phone-1",
      })
    ).toBe("/shop/electronics/phone-1");
    expect(
      translator.getTranslatedPath("it", "/shop/[category]/[productId]", {
        category: "elettronica",
        productId: "telefono-1",
      })
    ).toBe("/negozio/elettronica/telefono-1");
  });

  test("handles undeclared catch-all segment in path", () => {
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/docs/[...path]", { path: ["a", "b", "c"] })).toBe("/docs/a/b/c");
  });

  test("cache hit returns consistent result", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    const result1 = translator.getTranslatedPath("it", "/products/[id]", { id: "first" });
    const result2 = translator.getTranslatedPath("it", "/products/[id]", { id: "second" });

    expect(result1).toBe("/prodotti/first");
    expect(result2).toBe("/prodotti/second");
  });

  test("handles partial path match where later segments are undeclared", () => {
    const atlas = createMockAtlas({
      "/blog": {
        it: "/articoli",
        "/posts": {
          it: "/post",
        },
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("it", "/blog/posts/undeclared/deep", {})).toBe(
      "/articoli/post/undeclared/deep"
    );
  });

  test("works with single locale configuration", () => {
    const singleLocale = ["en"];
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new PathTranslator(atlas, singleLocale, "en");

    expect(translator.getTranslatedPath("en", "/about", {})).toBe("/about");
  });

  test("initializes caches for all locales in constructor", () => {
    const multiLocales = ["en", "it", "fr"];
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, multiLocales, "en");

    const caches = (translator as any).caches;
    expect(caches.en).toBeInstanceOf(Map);
    expect(caches.it).toBeInstanceOf(Map);
    expect(caches.fr).toBeInstanceOf(Map);
  });

  test("handles path with mixed declared and undeclared dynamic segments", () => {
    const atlas = createMockAtlas({
      "/users": {
        it: "/utenti",
        "/[userId]": {},
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(
      translator.getTranslatedPath("it", "/users/[userId]/posts/[postId]", {
        userId: "u1",
        postId: "p1",
      })
    ).toBe("/utenti/u1/posts/p1");
  });

  test("handles same translation for default locale", () => {
    const atlas = createMockAtlas({
      "/contact": {},
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/contact", {})).toBe("/contact");
    expect(translator.getTranslatedPath("it", "/contact", {})).toBe("/contact");
  });

  test("translates path with static segment after dynamic", () => {
    const atlas = createMockAtlas({
      "/users": {
        it: "/utenti",
        "/[id]": {
          "/settings": {
            it: "/impostazioni",
          },
        },
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/users/[id]/settings", { id: "42" })).toBe("/users/42/settings");
    expect(translator.getTranslatedPath("it", "/users/[id]/settings", { id: "42" })).toBe("/utenti/42/impostazioni");
  });

  test("handles multiple translations calls efficiently with caching", () => {
    const atlas = createMockAtlas({
      "/about": { it: "/chi-siamo" },
      "/contact": { it: "/contatti" },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    for (let i = 0; i < 100; i++) {
      translator.getTranslatedPath("en", "/about", {});
      translator.getTranslatedPath("it", "/contact", {});
    }

    const enCache = (translator as any).caches.en;
    const itCache = (translator as any).caches.it;

    expect(enCache.size).toBe(1);
    expect(itCache.size).toBe(1);
  });

  test("handles path with only dynamic segments", () => {
    const atlas = createMockAtlas({
      "/[category]": {
        "/[id]": {},
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/[category]/[id]", { category: "books", id: "123" })).toBe("/books/123");
  });

  test("handles undeclared optional catch-all segment", () => {
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/docs/[[...path]]", { path: ["a", "b"] })).toBe("/docs/a/b");
  });

  test("preserves segment order in complex nested paths", () => {
    const atlas = createMockAtlas({
      "/a": {
        it: "/uno",
        "/b": {
          it: "/due",
          "/c": {
            it: "/tre",
          },
        },
      },
    });
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(translator.getTranslatedPath("en", "/a/b/c", {})).toBe("/a/b/c");
    expect(translator.getTranslatedPath("it", "/a/b/c", {})).toBe("/uno/due/tre");
  });

  test("throws error when path does not start with /", () => {
    const atlas = createMockAtlas({});
    const translator = new PathTranslator(atlas, locales, defaultLocale);

    expect(() => translator.getTranslatedPath("en", "about", {})).toThrow('Path must start with "/"');
    expect(() => translator.getTranslatedPath("en", "", {})).toThrow('Path must start with "/"');
    expect(() => translator.getTranslatedPath("en", "users/profile", {})).toThrow('Path must start with "/"');
  });
});

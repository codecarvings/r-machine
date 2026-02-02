import { describe, expect, test } from "vitest";
import { getTranslatedHref, HrefTranslator } from "../../../src/core/href-translator.js";

describe("getTranslatedPath", () => {
  test("returns path with static segments", () => {
    const mappedSegments = [
      { decl: true, segment: "about", kind: "static" as const },
      { decl: true, segment: "team", kind: "static" as const },
    ];
    const result = getTranslatedHref("en", "/about/team", mappedSegments);
    expect(result).toBe("/about/team");
  });

  test("substitutes dynamic segment with param value", () => {
    const mappedSegments = [
      { decl: true, segment: "products", kind: "static" as const },
      { decl: true, segment: "id", kind: "dynamic" as const },
    ];
    const result = getTranslatedHref("en", "/products/[id]", mappedSegments, { id: "123" });
    expect(result).toBe("/products/123");
  });

  test("encodes param values", () => {
    const mappedSegments = [{ decl: true, segment: "query", kind: "dynamic" as const }];
    const result = getTranslatedHref("en", "/[query]", mappedSegments, { query: "hello world" });
    expect(result).toBe("/hello%20world");
  });

  test("substitutes catch-all segment with array values", () => {
    const mappedSegments = [
      { decl: true, segment: "docs", kind: "static" as const },
      { decl: true, segment: "path", kind: "catchAll" as const },
    ];
    const result = getTranslatedHref("en", "/docs/[...path]", mappedSegments, {
      path: ["getting-started", "installation"],
    });
    expect(result).toBe("/docs/getting-started/installation");
  });

  test("substitutes optional catch-all segment with array values", () => {
    const mappedSegments = [
      { decl: true, segment: "docs", kind: "static" as const },
      { decl: true, segment: "path", kind: "optionalCatchAll" as const },
    ];
    const result = getTranslatedHref("en", "/docs/[[...path]]", mappedSegments, {
      path: ["intro"],
    });
    expect(result).toBe("/docs/intro");
  });

  test("throws error when dynamic param is missing", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedHref("en", "/[id]", mappedSegments, {})).toThrow('parameter "id" is missing');
  });

  test("throws error when catch-all param is not an array", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    expect(() => getTranslatedHref("en", "/[...path]", mappedSegments, { path: "not-array" })).toThrow(
      'parameter "path" is expected to be an array'
    );
  });

  test("throws error when param value results in empty segment", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedHref("en", "/[id]", mappedSegments, { id: "" })).toThrow("empty path segment");
  });

  test("returns root path for empty mapped segments", () => {
    const result = getTranslatedHref("en", "/", []);
    expect(result).toBe("/");
  });

  test("handles single static segment", () => {
    const mappedSegments = [{ decl: true, segment: "home", kind: "static" as const }];
    const result = getTranslatedHref("en", "/home", mappedSegments);
    expect(result).toBe("/home");
  });

  test("handles multiple dynamic segments", () => {
    const mappedSegments = [
      { decl: true, segment: "category", kind: "dynamic" as const },
      { decl: true, segment: "productId", kind: "dynamic" as const },
      { decl: true, segment: "variant", kind: "dynamic" as const },
    ];
    const result = getTranslatedHref("en", "/[category]/[productId]/[variant]", mappedSegments, {
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
    const result = getTranslatedHref("en", "/shop/[category]/items/[id]", mappedSegments, {
      category: "books",
      id: "42",
    });
    expect(result).toBe("/shop/books/items/42");
  });

  test("converts numeric param values to string", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    const result = getTranslatedHref("en", "/[id]", mappedSegments, { id: 12345 });
    expect(result).toBe("/12345");
  });

  test("encodes special URL characters in param values", () => {
    const mappedSegments = [{ decl: true, segment: "query", kind: "dynamic" as const }];

    expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a/b" })).toBe("/a%2Fb");
    expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a?b=c" })).toBe("/a%3Fb%3Dc");
    expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a#section" })).toBe("/a%23section");
    expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a&b=1" })).toBe("/a%26b%3D1");
  });

  test("encodes unicode characters in param values", () => {
    const mappedSegments = [{ decl: true, segment: "name", kind: "dynamic" as const }];
    const result = getTranslatedHref("it", "/[name]", mappedSegments, { name: "caffè" });
    expect(result).toBe("/caff%C3%A8");
  });

  test("handles catch-all with single element array", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    const result = getTranslatedHref("en", "/[...path]", mappedSegments, { path: ["single"] });
    expect(result).toBe("/single");
  });

  test("handles catch-all with many elements", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    const result = getTranslatedHref("en", "/[...path]", mappedSegments, {
      path: ["a", "b", "c", "d", "e"],
    });
    expect(result).toBe("/a/b/c/d/e");
  });

  test("encodes values in catch-all arrays", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    const result = getTranslatedHref("en", "/[...path]", mappedSegments, {
      path: ["hello world", "foo/bar"],
    });
    expect(result).toBe("/hello%20world/foo%2Fbar");
  });

  test("converts numeric values in catch-all arrays to strings", () => {
    const mappedSegments = [{ decl: true, segment: "ids", kind: "catchAll" as const }];
    const result = getTranslatedHref("en", "/[...ids]", mappedSegments, {
      ids: [1, 2, 3],
    });
    expect(result).toBe("/1/2/3");
  });

  test("throws error when params object is undefined for dynamic segment", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedHref("en", "/[id]", mappedSegments, undefined)).toThrow('parameter "id" is missing');
  });

  test("throws error when catch-all array contains empty string", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
    expect(() => getTranslatedHref("en", "/[...path]", mappedSegments, { path: ["valid", ""] })).toThrow(
      "empty path segment"
    );
  });

  test("error message includes locale and path info", () => {
    const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
    expect(() => getTranslatedHref("it", "/users/[id]", mappedSegments, {})).toThrow(
      'Cannot translate path "/users/[id]" for locale "it"'
    );
  });

  test("handles optional catch-all same as regular catch-all", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "optionalCatchAll" as const }];
    const result = getTranslatedHref("en", "/[[...path]]", mappedSegments, {
      path: ["a", "b"],
    });
    expect(result).toBe("/a/b");
  });

  test("throws error when optional catch-all param is not an array", () => {
    const mappedSegments = [{ decl: true, segment: "path", kind: "optionalCatchAll" as const }];
    expect(() => getTranslatedHref("en", "/[[...path]]", mappedSegments, { path: "not-array" })).toThrow(
      'parameter "path" is expected to be an array'
    );
  });

  test("handles static segment after dynamic segment", () => {
    const mappedSegments = [
      { decl: true, segment: "id", kind: "dynamic" as const },
      { decl: true, segment: "edit", kind: "static" as const },
    ];
    const result = getTranslatedHref("en", "/[id]/edit", mappedSegments, { id: "123" });
    expect(result).toBe("/123/edit");
  });

  test("handles deeply nested path with all segment types", () => {
    const mappedSegments = [
      { decl: true, segment: "api", kind: "static" as const },
      { decl: true, segment: "version", kind: "dynamic" as const },
      { decl: true, segment: "resources", kind: "static" as const },
      { decl: true, segment: "path", kind: "catchAll" as const },
    ];
    const result = getTranslatedHref("en", "/api/[version]/resources/[...path]", mappedSegments, {
      version: "v2",
      path: ["users", "123", "posts"],
    });
    expect(result).toBe("/api/v2/resources/users/123/posts");
  });

  test("preserves param value case sensitivity", () => {
    const mappedSegments = [{ decl: true, segment: "name", kind: "dynamic" as const }];
    const result = getTranslatedHref("en", "/[name]", mappedSegments, { name: "CamelCase" });
    expect(result).toBe("/CamelCase");
  });

  test("converts boolean param values to string", () => {
    const mappedSegments = [{ decl: true, segment: "flag", kind: "dynamic" as const }];
    expect(getTranslatedHref("en", "/[flag]", mappedSegments, { flag: true })).toBe("/true");
    expect(getTranslatedHref("en", "/[flag]", mappedSegments, { flag: false })).toBe("/false");
  });

  test("converts object param values to string representation", () => {
    const mappedSegments = [{ decl: true, segment: "data", kind: "dynamic" as const }];
    const result = getTranslatedHref("en", "/[data]", mappedSegments, { data: { key: "value" } });
    expect(result).toBe("/%5Bobject%20Object%5D");
  });

  test("handles empty catch-all array by producing empty segment", () => {
    const mappedSegments = [
      { decl: true, segment: "docs", kind: "static" as const },
      { decl: true, segment: "path", kind: "catchAll" as const },
    ];
    const result = getTranslatedHref("en", "/docs/[...path]", mappedSegments, { path: [] });
    expect(result).toBe("/docs");
  });

  test("handles empty optional catch-all array", () => {
    const mappedSegments = [
      { decl: true, segment: "docs", kind: "static" as const },
      { decl: true, segment: "path", kind: "optionalCatchAll" as const },
    ];
    const result = getTranslatedHref("en", "/docs/[[...path]]", mappedSegments, { path: [] });
    expect(result).toBe("/docs");
  });
});

describe("HrefTranslator", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  function createMockAtlas(decl: object) {
    return { decl };
  }

  test("translates root path", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/", {})).toEqual({ value: "/", dynamic: false });
    expect(translator.get("it", "/", {})).toEqual({ value: "/", dynamic: false });
  });

  test("translates simple static path", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("it", "/about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
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
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about/team", {})).toEqual({ value: "/about/team", dynamic: false });
    expect(translator.get("it", "/about/team", {})).toEqual({ value: "/chi-siamo/staff", dynamic: false });
  });

  test("translates path with dynamic segment", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/products/[id]", { id: "123" })).toEqual({
      value: "/products/123",
      dynamic: true,
    });
    expect(translator.get("it", "/products/[id]", { id: "456" })).toEqual({
      value: "/prodotti/456",
      dynamic: true,
    });
  });

  test("translates path with catch-all segment", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[...slug]", { slug: ["intro", "getting-started"] })).toEqual({
      value: "/docs/intro/getting-started",
      dynamic: true,
    });
    expect(translator.get("it", "/docs/[...slug]", { slug: ["guida"] })).toEqual({
      value: "/documenti/guida",
      dynamic: true,
    });
  });

  test("handles undeclared path segments as-is", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about/unknown", {})).toEqual({
      value: "/about/unknown",
      dynamic: false,
    });
    expect(translator.get("it", "/about/unknown", {})).toEqual({
      value: "/chi-siamo/unknown",
      dynamic: false,
    });
  });

  test("handles completely undeclared path", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/unknown/path", {})).toEqual({ value: "/unknown/path", dynamic: false });
  });

  test("handles undeclared dynamic segment in path", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/users/[id]", { id: "42" })).toEqual({
      value: "/users/42",
      dynamic: true,
    });
  });

  test("caches mapped paths for declared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    translator.get("en", "/about", {});
    translator.get("en", "/about", {});

    const mappedPathCache = (translator as any).mappedPathCaches.en;
    expect(mappedPathCache.has("/about")).toBe(true);
  });

  test("caches result for non-dynamic paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    translator.get("en", "/about", {});

    const resultCache = (translator as any).caches.en;
    expect(resultCache.has("/about")).toBe(true);
    expect(resultCache.get("/about")).toEqual({ value: "/about", dynamic: false });
  });

  test("does not cache result for dynamic paths", () => {
    const atlas = createMockAtlas({
      "/products": {
        "/[id]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    translator.get("en", "/products/[id]", { id: "123" });

    const resultCache = (translator as any).caches.en;
    expect(resultCache.has("/products/[id]")).toBe(false);
  });

  test("does not cache mapped paths for undeclared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    translator.get("en", "/about/unknown", {});

    const mappedPathCache = (translator as any).mappedPathCaches.en;
    expect(mappedPathCache.has("/about/unknown")).toBe(false);
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
    const translator = new HrefTranslator(atlas, multiLocales, "en");

    expect(translator.get("en", "/about", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("it", "/about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
    expect(translator.get("fr", "/about", {})).toEqual({ value: "/a-propos", dynamic: false });
    expect(translator.get("de", "/about", {})).toEqual({ value: "/uber-uns", dynamic: false });
  });

  test("translates path with optional catch-all segment", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[[...slug]]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[[...slug]]", { slug: ["guide"] })).toEqual({
      value: "/docs/guide",
      dynamic: true,
    });
    expect(translator.get("it", "/docs/[[...slug]]", { slug: ["guida", "intro"] })).toEqual({
      value: "/documenti/guida/intro",
      dynamic: true,
    });
  });

  test("isolates caches between different locales", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    translator.get("en", "/about", {});
    translator.get("it", "/about", {});

    const enMappedPathCache = (translator as any).mappedPathCaches.en;
    const itMappedPathCache = (translator as any).mappedPathCaches.it;
    expect(enMappedPathCache.has("/about")).toBe(true);
    expect(itMappedPathCache.has("/about")).toBe(true);
    expect(enMappedPathCache).not.toBe(itMappedPathCache);

    const enResultCache = (translator as any).caches.en;
    const itResultCache = (translator as any).caches.it;
    expect(enResultCache.has("/about")).toBe(true);
    expect(itResultCache.has("/about")).toBe(true);
    expect(enResultCache).not.toBe(itResultCache);
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
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/api/v1/users/[id]/profile", { id: "123" })).toEqual({
      value: "/api/v1/users/123/profile",
      dynamic: true,
    });
    expect(translator.get("it", "/api/v1/users/[id]/profile", { id: "456" })).toEqual({
      value: "/api/v1/utenti/456/profilo",
      dynamic: true,
    });
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
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(
      translator.get("en", "/shop/[category]/[productId]", {
        category: "electronics",
        productId: "phone-1",
      })
    ).toEqual({ value: "/shop/electronics/phone-1", dynamic: true });
    expect(
      translator.get("it", "/shop/[category]/[productId]", {
        category: "elettronica",
        productId: "telefono-1",
      })
    ).toEqual({ value: "/negozio/elettronica/telefono-1", dynamic: true });
  });

  test("handles undeclared catch-all segment in path", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[...path]", { path: ["a", "b", "c"] })).toEqual({
      value: "/docs/a/b/c",
      dynamic: true,
    });
  });

  test("cache hit returns consistent result", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    const result1 = translator.get("it", "/products/[id]", { id: "first" });
    const result2 = translator.get("it", "/products/[id]", { id: "second" });

    expect(result1).toEqual({ value: "/prodotti/first", dynamic: true });
    expect(result2).toEqual({ value: "/prodotti/second", dynamic: true });
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
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("it", "/blog/posts/undeclared/deep", {})).toEqual({
      value: "/articoli/post/undeclared/deep",
      dynamic: false,
    });
  });

  test("works with single locale configuration", () => {
    const singleLocale = ["en"];
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslator(atlas, singleLocale, "en");

    expect(translator.get("en", "/about", {})).toEqual({ value: "/about", dynamic: false });
  });

  test("initializes all caches for all locales in constructor", () => {
    const multiLocales = ["en", "it", "fr"];
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, multiLocales, "en");

    const mappedPathCaches = (translator as any).mappedPathCaches;
    expect(mappedPathCaches.en).toBeInstanceOf(Map);
    expect(mappedPathCaches.it).toBeInstanceOf(Map);
    expect(mappedPathCaches.fr).toBeInstanceOf(Map);

    const resultCaches = (translator as any).caches;
    expect(resultCaches.en).toBeInstanceOf(Map);
    expect(resultCaches.it).toBeInstanceOf(Map);
    expect(resultCaches.fr).toBeInstanceOf(Map);
  });

  test("handles path with mixed declared and undeclared dynamic segments", () => {
    const atlas = createMockAtlas({
      "/users": {
        it: "/utenti",
        "/[userId]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(
      translator.get("it", "/users/[userId]/posts/[postId]", {
        userId: "u1",
        postId: "p1",
      })
    ).toEqual({ value: "/utenti/u1/posts/p1", dynamic: true });
  });

  test("handles same translation for default locale", () => {
    const atlas = createMockAtlas({
      "/contact": {},
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/contact", {})).toEqual({ value: "/contact", dynamic: false });
    expect(translator.get("it", "/contact", {})).toEqual({ value: "/contact", dynamic: false });
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
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/users/[id]/settings", { id: "42" })).toEqual({
      value: "/users/42/settings",
      dynamic: true,
    });
    expect(translator.get("it", "/users/[id]/settings", { id: "42" })).toEqual({
      value: "/utenti/42/impostazioni",
      dynamic: true,
    });
  });

  test("handles multiple translations calls efficiently with caching", () => {
    const atlas = createMockAtlas({
      "/about": { it: "/chi-siamo" },
      "/contact": { it: "/contatti" },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    for (let i = 0; i < 100; i++) {
      translator.get("en", "/about", {});
      translator.get("it", "/contact", {});
    }

    const enMappedPathCache = (translator as any).mappedPathCaches.en;
    const itMappedPathCache = (translator as any).mappedPathCaches.it;
    expect(enMappedPathCache.size).toBe(1);
    expect(itMappedPathCache.size).toBe(1);

    const enResultCache = (translator as any).caches.en;
    const itResultCache = (translator as any).caches.it;
    expect(enResultCache.size).toBe(1);
    expect(itResultCache.size).toBe(1);
  });

  test("handles path with only dynamic segments", () => {
    const atlas = createMockAtlas({
      "/[category]": {
        "/[id]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/[category]/[id]", { category: "books", id: "123" })).toEqual({
      value: "/books/123",
      dynamic: true,
    });
  });

  test("handles undeclared optional catch-all segment", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[[...path]]", { path: ["a", "b"] })).toEqual({
      value: "/docs/a/b",
      dynamic: true,
    });
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
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/a/b/c", {})).toEqual({ value: "/a/b/c", dynamic: false });
    expect(translator.get("it", "/a/b/c", {})).toEqual({ value: "/uno/due/tre", dynamic: false });
  });

  test("throws error when path does not start with /", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(() => translator.get("en", "about", {})).toThrow('Path must start with "/"');
    expect(() => translator.get("en", "", {})).toThrow('Path must start with "/"');
    expect(() => translator.get("en", "users/profile", {})).toThrow('Path must start with "/"');
  });

  test("handles path with trailing slash", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about/", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("it", "/about/", {})).toEqual({ value: "/chi-siamo", dynamic: false });
  });

  test("handles path with double slashes", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
        "/team": {
          it: "/staff",
        },
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about//team", {})).toEqual({ value: "/about/team", dynamic: false });
    expect(translator.get("it", "/about//team", {})).toEqual({ value: "/chi-siamo/staff", dynamic: false });
  });

  test("handles path with multiple trailing slashes", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about///", {})).toEqual({ value: "/about", dynamic: false });
  });

  test("handles path with leading double slashes", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "//about", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("it", "//about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
  });

  test("handles catch-all with empty array in declared path", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[...slug]", { slug: [] })).toEqual({
      value: "/docs",
      dynamic: true,
    });
    expect(translator.get("it", "/docs/[...slug]", { slug: [] })).toEqual({
      value: "/documenti",
      dynamic: true,
    });
  });

  test("handles optional catch-all with empty array in declared path", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[[...slug]]": {},
      },
    });
    const translator = new HrefTranslator(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[[...slug]]", { slug: [] })).toEqual({
      value: "/docs",
      dynamic: true,
    });
  });
});

class HrefTranslatorWithPreAdapter extends HrefTranslator {
  protected override readonly adapter = {
    fn: (_locale: string, path: string) => {
      const segments = path.split("/").filter((s) => s.length > 0);
      return `/${segments.slice(1).join("/")}`;
    },
    preApply: true as const,
  };
}

class HrefTranslatorWithPostAdapter extends HrefTranslator {
  protected override readonly adapter = {
    fn: (locale: string, path: string) => `/${locale}${path}`,
    preApply: false as const,
  };
}

describe("HrefTranslator with adapter (preApply: true)", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  function createMockAtlas(decl: object) {
    return { decl };
  }

  test("strips first segment before translation", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/en/about", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("it", "/it/about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
  });

  test("strips first segment for dynamic paths", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/en/products/[id]", { id: "123" })).toEqual({
      value: "/products/123",
      dynamic: true,
    });
    expect(translator.get("it", "/it/products/[id]", { id: "456" })).toEqual({
      value: "/prodotti/456",
      dynamic: true,
    });
  });

  test("caches results using original path as key", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    translator.get("en", "/en/about", {});
    translator.get("en", "/en/about", {});

    const resultCache = (translator as any).caches.en;
    expect(resultCache.has("/en/about")).toBe(true);
    expect(resultCache.get("/en/about")).toEqual({ value: "/about", dynamic: false });
  });

  test("handles single segment path (becomes root)", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/en", {})).toEqual({ value: "/", dynamic: false });
  });

  test("strips first segment from nested paths", () => {
    const atlas = createMockAtlas({
      "/api": {
        "/v1": {
          "/users": {
            it: "/utenti",
          },
        },
      },
    });
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/en/api/v1/users", {})).toEqual({
      value: "/api/v1/users",
      dynamic: false,
    });
    expect(translator.get("it", "/it/api/v1/users", {})).toEqual({
      value: "/api/v1/utenti",
      dynamic: false,
    });
  });

  test("handles undeclared paths after stripping first segment", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/prefix/about/unknown", {})).toEqual({
      value: "/about/unknown",
      dynamic: false,
    });
  });

  test("works with any first segment value", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslatorWithPreAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/foo/about", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("en", "/bar/about", {})).toEqual({ value: "/about", dynamic: false });
    expect(translator.get("it", "/xyz/about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
  });
});

describe("HrefTranslator with adapter (preApply: false)", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  function createMockAtlas(decl: object) {
    return { decl };
  }

  test("transforms result after translation with locale prefix", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/about", {})).toEqual({ value: "/en/about", dynamic: false });
    expect(translator.get("it", "/about", {})).toEqual({ value: "/it/chi-siamo", dynamic: false });
  });

  test("transforms result for dynamic segments", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/products/[id]", { id: "123" })).toEqual({
      value: "/en/products/123",
      dynamic: true,
    });
    expect(translator.get("it", "/products/[id]", { id: "456" })).toEqual({
      value: "/it/prodotti/456",
      dynamic: true,
    });
  });

  test("caches non-dynamic results with transformed value", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    translator.get("en", "/about", {});

    const resultCache = (translator as any).caches.en;
    expect(resultCache.has("/about")).toBe(true);
    expect(resultCache.get("/about")).toEqual({ value: "/en/about", dynamic: false });
  });

  test("does not cache dynamic results", () => {
    const atlas = createMockAtlas({
      "/products": {
        "/[id]": {},
      },
    });
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    translator.get("en", "/products/[id]", { id: "123" });

    const resultCache = (translator as any).caches.en;
    expect(resultCache.has("/products/[id]")).toBe(false);
  });

  test("transforms root path result", () => {
    const atlas = createMockAtlas({});
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/", {})).toEqual({ value: "/en/", dynamic: false });
    expect(translator.get("it", "/", {})).toEqual({ value: "/it/", dynamic: false });
  });

  test("transforms nested paths result", () => {
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
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/api/v1/users/[id]/profile", { id: "42" })).toEqual({
      value: "/en/api/v1/users/42/profile",
      dynamic: true,
    });
    expect(translator.get("it", "/api/v1/users/[id]/profile", { id: "42" })).toEqual({
      value: "/it/api/v1/utenti/42/profilo",
      dynamic: true,
    });
  });

  test("transforms catch-all result", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    expect(translator.get("en", "/docs/[...slug]", { slug: ["guide", "intro"] })).toEqual({
      value: "/en/docs/guide/intro",
      dynamic: true,
    });
    expect(translator.get("it", "/docs/[...slug]", { slug: ["guida"] })).toEqual({
      value: "/it/documenti/guida",
      dynamic: true,
    });
  });

  test("maintains separate caches per locale with transformed values", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const translator = new HrefTranslatorWithPostAdapter(atlas, locales, defaultLocale);

    translator.get("en", "/about", {});
    translator.get("it", "/about", {});

    const enCache = (translator as any).caches.en;
    const itCache = (translator as any).caches.it;

    expect(enCache.get("/about")).toEqual({ value: "/en/about", dynamic: false });
    expect(itCache.get("/about")).toEqual({ value: "/it/chi-siamo", dynamic: false });
  });
});

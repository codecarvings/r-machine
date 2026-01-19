import { describe, expect, test } from "vitest";
import { buildPathAtlasSegmentTree, getSegmentData, PathCanonicalizer } from "./path-canonicalizer.js";

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
});

describe("PathCanonicalizer", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  function createMockAtlas(decl: object) {
    return { decl };
  }

  test("canonicalizes root path", () => {
    const atlas = createMockAtlas({});
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/")).toEqual({ path: "/", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/")).toEqual({ path: "/", dynamic: false });
  });

  test("canonicalizes simple static path", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/about")).toEqual({ path: "/about", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/chi-siamo")).toEqual({ path: "/about", dynamic: false });
  });

  test("canonicalizes nested static path", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
        "/team": {
          it: "/staff",
        },
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/about/team")).toEqual({ path: "/about/team", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/chi-siamo/staff")).toEqual({ path: "/about/team", dynamic: false });
  });

  test("canonicalizes path with dynamic segment - keeps dynamic value", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/products/123")).toEqual({
      path: "/products/123",
      dynamic: true,
    });
    expect(canonicalizer.getCanonicalPath("it", "/prodotti/456")).toEqual({
      path: "/products/456",
      dynamic: true,
    });
  });

  test("canonicalizes path with catch-all segment - keeps all dynamic values", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/docs/intro/getting-started")).toEqual({
      path: "/docs/intro/getting-started",
      dynamic: true,
    });
    expect(canonicalizer.getCanonicalPath("it", "/documenti/introduzione/inizio")).toEqual({
      path: "/docs/introduzione/inizio",
      dynamic: true,
    });
  });

  test("example 1: canonicalizes /chi-siamo/staff to /about/team", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
        "/team": {
          it: "/staff",
        },
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    const result = canonicalizer.getCanonicalPath("it", "/chi-siamo/staff");
    expect(result).toEqual({ path: "/about/team", dynamic: false });
  });

  test("example 2: canonicalizes /documenti/introduzione/inizio to /docs/introduzione/inizio", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    const result = canonicalizer.getCanonicalPath("it", "/documenti/introduzione/inizio");
    expect(result).toEqual({ path: "/docs/introduzione/inizio", dynamic: true });
  });

  test("handles undeclared path segments as-is", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/about/unknown")).toEqual({
      path: "/about/unknown",
      dynamic: false,
    });
    expect(canonicalizer.getCanonicalPath("it", "/chi-siamo/unknown")).toEqual({
      path: "/about/unknown",
      dynamic: false,
    });
  });

  test("handles completely undeclared path", () => {
    const atlas = createMockAtlas({});
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/unknown/path")).toEqual({ path: "/unknown/path", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/unknown/path")).toEqual({ path: "/unknown/path", dynamic: false });
  });

  test("caches mapped paths for declared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.getCanonicalPath("en", "/about");
    canonicalizer.getCanonicalPath("en", "/about");

    const mappedPathCache = (canonicalizer as any).mappedPathCaches.en;
    expect(mappedPathCache.has("/about")).toBe(true);
  });

  test("caches result for non-dynamic paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.getCanonicalPath("en", "/about");

    const resultCache = (canonicalizer as any).caches.en;
    expect(resultCache.has("/about")).toBe(true);
    expect(resultCache.get("/about")).toEqual({ path: "/about", dynamic: false });
  });

  test("does not cache result for dynamic paths", () => {
    const atlas = createMockAtlas({
      "/products": {
        "/[id]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.getCanonicalPath("en", "/products/123");

    const resultCache = (canonicalizer as any).caches.en;
    expect(resultCache.has("/products/123")).toBe(false);
  });

  test("does not cache mapped paths for undeclared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.getCanonicalPath("en", "/about/unknown");

    const mappedPathCache = (canonicalizer as any).mappedPathCaches.en;
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
    const canonicalizer = new PathCanonicalizer(atlas, multiLocales, "en");

    expect(canonicalizer.getCanonicalPath("en", "/about")).toEqual({ path: "/about", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/chi-siamo")).toEqual({ path: "/about", dynamic: false });
    expect(canonicalizer.getCanonicalPath("fr", "/a-propos")).toEqual({ path: "/about", dynamic: false });
    expect(canonicalizer.getCanonicalPath("de", "/uber-uns")).toEqual({ path: "/about", dynamic: false });
  });

  test("canonicalizes path with optional catch-all segment", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[[...slug]]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/docs/guide")).toEqual({
      path: "/docs/guide",
      dynamic: true,
    });
    expect(canonicalizer.getCanonicalPath("it", "/documenti/guida/intro")).toEqual({
      path: "/docs/guida/intro",
      dynamic: true,
    });
  });

  test("isolates caches between different locales", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.getCanonicalPath("en", "/about");
    canonicalizer.getCanonicalPath("it", "/chi-siamo");

    const enMappedPathCache = (canonicalizer as any).mappedPathCaches.en;
    const itMappedPathCache = (canonicalizer as any).mappedPathCaches.it;
    expect(enMappedPathCache.has("/about")).toBe(true);
    expect(itMappedPathCache.has("/chi-siamo")).toBe(true);
    expect(enMappedPathCache).not.toBe(itMappedPathCache);

    const enResultCache = (canonicalizer as any).caches.en;
    const itResultCache = (canonicalizer as any).caches.it;
    expect(enResultCache.has("/about")).toBe(true);
    expect(itResultCache.has("/chi-siamo")).toBe(true);
    expect(enResultCache).not.toBe(itResultCache);
  });

  test("canonicalizes deeply nested path (4 levels)", () => {
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
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/api/v1/users/123/profile")).toEqual({
      path: "/api/v1/users/123/profile",
      dynamic: true,
    });
    expect(canonicalizer.getCanonicalPath("it", "/api/v1/utenti/456/profilo")).toEqual({
      path: "/api/v1/users/456/profile",
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
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/shop/electronics/phone-1")).toEqual({
      path: "/shop/electronics/phone-1",
      dynamic: true,
    });
    expect(canonicalizer.getCanonicalPath("it", "/negozio/elettronica/telefono-1")).toEqual({
      path: "/shop/elettronica/telefono-1",
      dynamic: true,
    });
  });

  test("cache hit returns consistent result for translated paths", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    const result1 = canonicalizer.getCanonicalPath("it", "/prodotti/first");
    const result2 = canonicalizer.getCanonicalPath("it", "/prodotti/second");

    expect(result1).toEqual({ path: "/products/first", dynamic: true });
    expect(result2).toEqual({ path: "/products/second", dynamic: true });
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
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/articoli/post/undeclared/deep")).toEqual({
      path: "/blog/posts/undeclared/deep",
      dynamic: false,
    });
  });

  test("works with single locale configuration", () => {
    const singleLocale = ["en"];
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new PathCanonicalizer(atlas, singleLocale, "en");

    expect(canonicalizer.getCanonicalPath("en", "/about")).toEqual({ path: "/about", dynamic: false });
  });

  test("initializes all caches for all locales in constructor", () => {
    const multiLocales = ["en", "it", "fr"];
    const atlas = createMockAtlas({});
    const canonicalizer = new PathCanonicalizer(atlas, multiLocales, "en");

    const mappedPathCaches = (canonicalizer as any).mappedPathCaches;
    expect(mappedPathCaches.en).toBeInstanceOf(Map);
    expect(mappedPathCaches.it).toBeInstanceOf(Map);
    expect(mappedPathCaches.fr).toBeInstanceOf(Map);

    const resultCaches = (canonicalizer as any).caches;
    expect(resultCaches.en).toBeInstanceOf(Map);
    expect(resultCaches.it).toBeInstanceOf(Map);
    expect(resultCaches.fr).toBeInstanceOf(Map);
  });

  test("handles same translation for default locale", () => {
    const atlas = createMockAtlas({
      "/contact": {},
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/contact")).toEqual({ path: "/contact", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/contact")).toEqual({ path: "/contact", dynamic: false });
  });

  test("canonicalizes path with static segment after dynamic", () => {
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
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/users/42/settings")).toEqual({
      path: "/users/42/settings",
      dynamic: true,
    });
    expect(canonicalizer.getCanonicalPath("it", "/utenti/42/impostazioni")).toEqual({
      path: "/users/42/settings",
      dynamic: true,
    });
  });

  test("handles multiple translation calls efficiently with caching", () => {
    const atlas = createMockAtlas({
      "/about": { it: "/chi-siamo" },
      "/contact": { it: "/contatti" },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    for (let i = 0; i < 100; i++) {
      canonicalizer.getCanonicalPath("en", "/about");
      canonicalizer.getCanonicalPath("it", "/contatti");
    }

    const enMappedPathCache = (canonicalizer as any).mappedPathCaches.en;
    const itMappedPathCache = (canonicalizer as any).mappedPathCaches.it;
    expect(enMappedPathCache.size).toBe(1);
    expect(itMappedPathCache.size).toBe(1);

    const enResultCache = (canonicalizer as any).caches.en;
    const itResultCache = (canonicalizer as any).caches.it;
    expect(enResultCache.size).toBe(1);
    expect(itResultCache.size).toBe(1);
  });

  test("handles path with only dynamic segments", () => {
    const atlas = createMockAtlas({
      "/[category]": {
        "/[id]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/books/123")).toEqual({
      path: "/books/123",
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
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("en", "/a/b/c")).toEqual({ path: "/a/b/c", dynamic: false });
    expect(canonicalizer.getCanonicalPath("it", "/uno/due/tre")).toEqual({ path: "/a/b/c", dynamic: false });
  });

  test("throws error when path does not start with /", () => {
    const atlas = createMockAtlas({});
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(() => canonicalizer.getCanonicalPath("en", "about")).toThrow('Path must start with "/"');
    expect(() => canonicalizer.getCanonicalPath("en", "")).toThrow('Path must start with "/"');
    expect(() => canonicalizer.getCanonicalPath("en", "users/profile")).toThrow('Path must start with "/"');
  });

  test("prefers static match over dynamic when both exist", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/featured": {
          it: "/in-evidenza",
        },
        "/[id]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/prodotti/in-evidenza")).toEqual({
      path: "/products/featured",
      dynamic: false,
    });
    expect(canonicalizer.getCanonicalPath("it", "/prodotti/123")).toEqual({
      path: "/products/123",
      dynamic: true,
    });
  });

  test("handles URL-encoded segments as-is", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/documenti/hello%20world")).toEqual({
      path: "/docs/hello%20world",
      dynamic: true,
    });
  });

  test("handles mixed declared and undeclared dynamic segments", () => {
    const atlas = createMockAtlas({
      "/users": {
        it: "/utenti",
        "/[userId]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/utenti/u1/posts/p1")).toEqual({
      path: "/users/u1/posts/p1",
      dynamic: true,
    });
  });

  test("handles single segment catch-all", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/documenti/intro")).toEqual({
      path: "/docs/intro",
      dynamic: true,
    });
  });

  test("handles deeply nested catch-all", () => {
    const atlas = createMockAtlas({
      "/api": {
        "/v1": {
          "/resources": {
            it: "/risorse",
            "/[...path]": {},
          },
        },
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/api/v1/risorse/users/123/posts")).toEqual({
      path: "/api/v1/resources/users/123/posts",
      dynamic: true,
    });
  });

  test("handles path where only first segment is translated", () => {
    const atlas = createMockAtlas({
      "/blog": {
        it: "/articoli",
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/articoli/my-post/comments")).toEqual({
      path: "/blog/my-post/comments",
      dynamic: false,
    });
  });

  test("handles empty translation (same as canonical) correctly", () => {
    const atlas = createMockAtlas({
      "/settings": {
        "/profile": {
          it: "/profilo",
        },
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/settings/profilo")).toEqual({
      path: "/settings/profile",
      dynamic: false,
    });
    expect(canonicalizer.getCanonicalPath("en", "/settings/profile")).toEqual({
      path: "/settings/profile",
      dynamic: false,
    });
  });

  test("integration: round-trip with PathTranslator patterns", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
        "/team": {
          it: "/staff",
        },
      },
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
      "/products": {
        it: "/prodotti",
        "/[id]": {
          "/reviews": {
            it: "/recensioni",
          },
        },
      },
    });
    const canonicalizer = new PathCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.getCanonicalPath("it", "/chi-siamo/staff")).toEqual({
      path: "/about/team",
      dynamic: false,
    });

    expect(canonicalizer.getCanonicalPath("it", "/documenti/intro/start")).toEqual({
      path: "/docs/intro/start",
      dynamic: true,
    });

    expect(canonicalizer.getCanonicalPath("it", "/prodotti/123/recensioni")).toEqual({
      path: "/products/123/reviews",
      dynamic: true,
    });
  });
});

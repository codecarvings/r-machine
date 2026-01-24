import { describe, expect, test } from "vitest";
import { HrefCanonicalizer } from "./href-canonicalizer.js";

describe("HrefCanonicalizer", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  function createMockAtlas(decl: object) {
    return { decl };
  }

  test("canonicalizes root path", () => {
    const atlas = createMockAtlas({});
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/")).toEqual({ value: "/", dynamic: false });
    expect(canonicalizer.get("it", "/")).toEqual({ value: "/", dynamic: false });
  });

  test("canonicalizes simple static path", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
    expect(canonicalizer.get("it", "/chi-siamo")).toEqual({ value: "/about", dynamic: false });
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/about/team")).toEqual({ value: "/about/team", dynamic: false });
    expect(canonicalizer.get("it", "/chi-siamo/staff")).toEqual({ value: "/about/team", dynamic: false });
  });

  test("canonicalizes path with dynamic segment - keeps dynamic value", () => {
    const atlas = createMockAtlas({
      "/products": {
        it: "/prodotti",
        "/[id]": {},
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/products/123")).toEqual({
      value: "/products/123",
      dynamic: true,
    });
    expect(canonicalizer.get("it", "/prodotti/456")).toEqual({
      value: "/products/456",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/docs/intro/getting-started")).toEqual({
      value: "/docs/intro/getting-started",
      dynamic: true,
    });
    expect(canonicalizer.get("it", "/documenti/introduzione/inizio")).toEqual({
      value: "/docs/introduzione/inizio",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    const result = canonicalizer.get("it", "/chi-siamo/staff");
    expect(result).toEqual({ value: "/about/team", dynamic: false });
  });

  test("example 2: canonicalizes /documenti/introduzione/inizio to /docs/introduzione/inizio", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[...slug]": {},
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    const result = canonicalizer.get("it", "/documenti/introduzione/inizio");
    expect(result).toEqual({ value: "/docs/introduzione/inizio", dynamic: true });
  });

  test("handles undeclared path segments as-is", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/about/unknown")).toEqual({
      value: "/about/unknown",
      dynamic: false,
    });
    expect(canonicalizer.get("it", "/chi-siamo/unknown")).toEqual({
      value: "/about/unknown",
      dynamic: false,
    });
  });

  test("handles completely undeclared path", () => {
    const atlas = createMockAtlas({});
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/unknown/path")).toEqual({ value: "/unknown/path", dynamic: false });
    expect(canonicalizer.get("it", "/unknown/path")).toEqual({ value: "/unknown/path", dynamic: false });
  });

  test("caches mapped paths for declared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.get("en", "/about");
    canonicalizer.get("en", "/about");

    const mappedPathCache = (canonicalizer as any).mappedPathCaches.en;
    expect(mappedPathCache.has("/about")).toBe(true);
  });

  test("caches result for non-dynamic paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.get("en", "/about");

    const resultCache = (canonicalizer as any).caches.en;
    expect(resultCache.has("/about")).toBe(true);
    expect(resultCache.get("/about")).toEqual({ value: "/about", dynamic: false });
  });

  test("does not cache result for dynamic paths", () => {
    const atlas = createMockAtlas({
      "/products": {
        "/[id]": {},
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.get("en", "/products/123");

    const resultCache = (canonicalizer as any).caches.en;
    expect(resultCache.has("/products/123")).toBe(false);
  });

  test("does not cache mapped paths for undeclared paths", () => {
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.get("en", "/about/unknown");

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
    const canonicalizer = new HrefCanonicalizer(atlas, multiLocales, "en");

    expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
    expect(canonicalizer.get("it", "/chi-siamo")).toEqual({ value: "/about", dynamic: false });
    expect(canonicalizer.get("fr", "/a-propos")).toEqual({ value: "/about", dynamic: false });
    expect(canonicalizer.get("de", "/uber-uns")).toEqual({ value: "/about", dynamic: false });
  });

  test("canonicalizes path with optional catch-all segment", () => {
    const atlas = createMockAtlas({
      "/docs": {
        it: "/documenti",
        "/[[...slug]]": {},
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/docs/guide")).toEqual({
      value: "/docs/guide",
      dynamic: true,
    });
    expect(canonicalizer.get("it", "/documenti/guida/intro")).toEqual({
      value: "/docs/guida/intro",
      dynamic: true,
    });
  });

  test("isolates caches between different locales", () => {
    const atlas = createMockAtlas({
      "/about": {
        it: "/chi-siamo",
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    canonicalizer.get("en", "/about");
    canonicalizer.get("it", "/chi-siamo");

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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/api/v1/users/123/profile")).toEqual({
      value: "/api/v1/users/123/profile",
      dynamic: true,
    });
    expect(canonicalizer.get("it", "/api/v1/utenti/456/profilo")).toEqual({
      value: "/api/v1/users/456/profile",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/shop/electronics/phone-1")).toEqual({
      value: "/shop/electronics/phone-1",
      dynamic: true,
    });
    expect(canonicalizer.get("it", "/negozio/elettronica/telefono-1")).toEqual({
      value: "/shop/elettronica/telefono-1",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    const result1 = canonicalizer.get("it", "/prodotti/first");
    const result2 = canonicalizer.get("it", "/prodotti/second");

    expect(result1).toEqual({ value: "/products/first", dynamic: true });
    expect(result2).toEqual({ value: "/products/second", dynamic: true });
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/articoli/post/undeclared/deep")).toEqual({
      value: "/blog/posts/undeclared/deep",
      dynamic: false,
    });
  });

  test("works with single locale configuration", () => {
    const singleLocale = ["en"];
    const atlas = createMockAtlas({
      "/about": {},
    });
    const canonicalizer = new HrefCanonicalizer(atlas, singleLocale, "en");

    expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
  });

  test("initializes all caches for all locales in constructor", () => {
    const multiLocales = ["en", "it", "fr"];
    const atlas = createMockAtlas({});
    const canonicalizer = new HrefCanonicalizer(atlas, multiLocales, "en");

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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/contact")).toEqual({ value: "/contact", dynamic: false });
    expect(canonicalizer.get("it", "/contact")).toEqual({ value: "/contact", dynamic: false });
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/users/42/settings")).toEqual({
      value: "/users/42/settings",
      dynamic: true,
    });
    expect(canonicalizer.get("it", "/utenti/42/impostazioni")).toEqual({
      value: "/users/42/settings",
      dynamic: true,
    });
  });

  test("handles multiple translation calls efficiently with caching", () => {
    const atlas = createMockAtlas({
      "/about": { it: "/chi-siamo" },
      "/contact": { it: "/contatti" },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    for (let i = 0; i < 100; i++) {
      canonicalizer.get("en", "/about");
      canonicalizer.get("it", "/contatti");
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/books/123")).toEqual({
      value: "/books/123",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("en", "/a/b/c")).toEqual({ value: "/a/b/c", dynamic: false });
    expect(canonicalizer.get("it", "/uno/due/tre")).toEqual({ value: "/a/b/c", dynamic: false });
  });

  test("throws error when path does not start with /", () => {
    const atlas = createMockAtlas({});
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(() => canonicalizer.get("en", "about")).toThrow('Path must start with "/"');
    expect(() => canonicalizer.get("en", "")).toThrow('Path must start with "/"');
    expect(() => canonicalizer.get("en", "users/profile")).toThrow('Path must start with "/"');
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/prodotti/in-evidenza")).toEqual({
      value: "/products/featured",
      dynamic: false,
    });
    expect(canonicalizer.get("it", "/prodotti/123")).toEqual({
      value: "/products/123",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/documenti/hello%20world")).toEqual({
      value: "/docs/hello%20world",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/utenti/u1/posts/p1")).toEqual({
      value: "/users/u1/posts/p1",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/documenti/intro")).toEqual({
      value: "/docs/intro",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/api/v1/risorse/users/123/posts")).toEqual({
      value: "/api/v1/resources/users/123/posts",
      dynamic: true,
    });
  });

  test("handles path where only first segment is translated", () => {
    const atlas = createMockAtlas({
      "/blog": {
        it: "/articoli",
      },
    });
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/articoli/my-post/comments")).toEqual({
      value: "/blog/my-post/comments",
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/settings/profilo")).toEqual({
      value: "/settings/profile",
      dynamic: false,
    });
    expect(canonicalizer.get("en", "/settings/profile")).toEqual({
      value: "/settings/profile",
      dynamic: false,
    });
  });

  test("integration: round-trip with HrefTranslator patterns", () => {
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
    const canonicalizer = new HrefCanonicalizer(atlas, locales, defaultLocale);

    expect(canonicalizer.get("it", "/chi-siamo/staff")).toEqual({
      value: "/about/team",
      dynamic: false,
    });

    expect(canonicalizer.get("it", "/documenti/intro/start")).toEqual({
      value: "/docs/intro/start",
      dynamic: true,
    });

    expect(canonicalizer.get("it", "/prodotti/123/recensioni")).toEqual({
      value: "/products/123/reviews",
      dynamic: true,
    });
  });
});

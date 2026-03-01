import { describe, expect, it } from "vitest";
import { getCanonicalizedHref, HrefCanonicalizer } from "../../../src/core/href-canonicalizer.js";
import {
  aboutAtlas,
  aboutWithTeamAtlas,
  createMockAtlas,
  docsWithCatchAllAtlas,
  docsWithOptionalCatchAllAtlas,
  productsAtlas,
} from "../_fixtures/_helpers.js";

describe("getCanonicalizedHref", () => {
  it("returns root path for empty segments", () => {
    expect(getCanonicalizedHref([])).toBe("/");
  });

  it("joins multiple segments with /", () => {
    const result = getCanonicalizedHref([
      { decl: true, segment: "about", kind: "static" as const },
      { decl: true, segment: "team", kind: "static" as const },
    ]);
    expect(result).toBe("/about/team");
  });

  it("only reads segment property, ignores kind and decl", () => {
    const result = getCanonicalizedHref([
      { decl: true, segment: "about", kind: "static" as const },
      { decl: false, segment: "unknown", kind: "dynamic" as const },
      { decl: true, segment: "hello%20world", kind: "catchAll" as const },
    ]);
    expect(result).toBe("/about/unknown/hello%20world");
  });
});

describe("HrefCanonicalizer", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  describe("static paths", () => {
    it("canonicalizes root path", () => {
      const canonicalizer = new HrefCanonicalizer(createMockAtlas(), locales, defaultLocale);

      expect(canonicalizer.get("en", "/")).toEqual({ value: "/", dynamic: false });
      expect(canonicalizer.get("it", "/")).toEqual({ value: "/", dynamic: false });
    });

    it("canonicalizes simple static path", () => {
      const canonicalizer = new HrefCanonicalizer(aboutAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("it", "/chi-siamo")).toEqual({ value: "/about", dynamic: false });
    });

    it("canonicalizes nested static path", () => {
      const canonicalizer = new HrefCanonicalizer(aboutWithTeamAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/about/team")).toEqual({ value: "/about/team", dynamic: false });
      expect(canonicalizer.get("it", "/chi-siamo/staff")).toEqual({ value: "/about/team", dynamic: false });
    });

    it("preserves segment order in complex nested paths", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({
          "/a": { it: "/uno", "/b": { it: "/due", "/c": { it: "/tre" } } },
        }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("en", "/a/b/c")).toEqual({ value: "/a/b/c", dynamic: false });
      expect(canonicalizer.get("it", "/uno/due/tre")).toEqual({ value: "/a/b/c", dynamic: false });
    });

    it("uses canonical path when locale has no translation", () => {
      const canonicalizer = new HrefCanonicalizer(createMockAtlas({ "/contact": {} }), locales, defaultLocale);

      expect(canonicalizer.get("en", "/contact")).toEqual({ value: "/contact", dynamic: false });
      expect(canonicalizer.get("it", "/contact")).toEqual({ value: "/contact", dynamic: false });
    });

    it("resolves partial translations (only some segments translated)", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/settings": { "/profile": { it: "/profilo" } } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/settings/profilo")).toEqual({ value: "/settings/profile", dynamic: false });
      expect(canonicalizer.get("en", "/settings/profile")).toEqual({ value: "/settings/profile", dynamic: false });
    });

    it("works with multiple locales", () => {
      const multiLocales = ["en", "it", "fr", "de"];
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/about": { it: "/chi-siamo", fr: "/a-propos", de: "/uber-uns" } }),
        multiLocales,
        "en"
      );

      expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("it", "/chi-siamo")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("fr", "/a-propos")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("de", "/uber-uns")).toEqual({ value: "/about", dynamic: false });
    });
  });

  describe("dynamic paths", () => {
    it("keeps dynamic segment value", () => {
      const canonicalizer = new HrefCanonicalizer(productsAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/products/123")).toEqual({ value: "/products/123", dynamic: true });
      expect(canonicalizer.get("it", "/prodotti/456")).toEqual({ value: "/products/456", dynamic: true });
    });

    it("keeps catch-all dynamic values", () => {
      const canonicalizer = new HrefCanonicalizer(docsWithCatchAllAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/docs/intro/getting-started")).toEqual({
        value: "/docs/intro/getting-started",
        dynamic: true,
      });
      expect(canonicalizer.get("it", "/documenti/introduzione/inizio")).toEqual({
        value: "/docs/introduzione/inizio",
        dynamic: true,
      });
    });

    it("handles optional catch-all segment", () => {
      const canonicalizer = new HrefCanonicalizer(docsWithOptionalCatchAllAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/docs/guide")).toEqual({ value: "/docs/guide", dynamic: true });
      expect(canonicalizer.get("it", "/documenti/guida/intro")).toEqual({
        value: "/docs/guida/intro",
        dynamic: true,
      });
    });

    it("handles multiple dynamic segments", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/shop": { it: "/negozio", "/[category]": { "/[productId]": {} } } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("en", "/shop/electronics/phone-1")).toEqual({
        value: "/shop/electronics/phone-1",
        dynamic: true,
      });
      expect(canonicalizer.get("it", "/negozio/elettronica/telefono-1")).toEqual({
        value: "/shop/elettronica/telefono-1",
        dynamic: true,
      });
    });

    it("canonicalizes static segment after dynamic", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({
          "/users": { it: "/utenti", "/[id]": { "/settings": { it: "/impostazioni" } } },
        }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("en", "/users/42/settings")).toEqual({
        value: "/users/42/settings",
        dynamic: true,
      });
      expect(canonicalizer.get("it", "/utenti/42/impostazioni")).toEqual({
        value: "/users/42/settings",
        dynamic: true,
      });
    });

    it("handles path with only dynamic segments", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/[category]": { "/[id]": {} } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("en", "/books/123")).toEqual({ value: "/books/123", dynamic: true });
    });

    it("produces consistent results across repeated dynamic calls", () => {
      const canonicalizer = new HrefCanonicalizer(productsAtlas, locales, defaultLocale);

      expect(canonicalizer.get("it", "/prodotti/first")).toEqual({ value: "/products/first", dynamic: true });
      expect(canonicalizer.get("it", "/prodotti/first")).toEqual({ value: "/products/first", dynamic: true });
      expect(canonicalizer.get("it", "/prodotti/second")).toEqual({ value: "/products/second", dynamic: true });
    });

    it("prefers static match over dynamic when both exist", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({
          "/products": { it: "/prodotti", "/featured": { it: "/in-evidenza" }, "/[id]": {} },
        }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/prodotti/in-evidenza")).toEqual({
        value: "/products/featured",
        dynamic: false,
      });
      expect(canonicalizer.get("it", "/prodotti/123")).toEqual({ value: "/products/123", dynamic: true });
    });

    it("canonicalizes deeply nested path (4 levels)", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({
          "/api": { "/v1": { "/users": { it: "/utenti", "/[id]": { "/profile": { it: "/profilo" } } } } },
        }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("en", "/api/v1/users/123/profile")).toEqual({
        value: "/api/v1/users/123/profile",
        dynamic: true,
      });
      expect(canonicalizer.get("it", "/api/v1/utenti/456/profilo")).toEqual({
        value: "/api/v1/users/456/profile",
        dynamic: true,
      });
    });

    it("handles deeply nested catch-all", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/api": { "/v1": { "/resources": { it: "/risorse", "/[...path]": {} } } } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/api/v1/risorse/users/123/posts")).toEqual({
        value: "/api/v1/resources/users/123/posts",
        dynamic: true,
      });
    });
  });

  describe("undeclared paths", () => {
    it("handles undeclared path segments as-is", () => {
      const canonicalizer = new HrefCanonicalizer(aboutAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/about/unknown")).toEqual({ value: "/about/unknown", dynamic: false });
      expect(canonicalizer.get("it", "/chi-siamo/unknown")).toEqual({ value: "/about/unknown", dynamic: false });
    });

    it("handles completely undeclared path", () => {
      const canonicalizer = new HrefCanonicalizer(createMockAtlas(), locales, defaultLocale);

      expect(canonicalizer.get("en", "/unknown/path")).toEqual({ value: "/unknown/path", dynamic: false });
      expect(canonicalizer.get("it", "/unknown/path")).toEqual({ value: "/unknown/path", dynamic: false });
    });

    it("handles partial path match where later segments are undeclared", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/blog": { it: "/articoli", "/posts": { it: "/post" } } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/articoli/post/undeclared/deep")).toEqual({
        value: "/blog/posts/undeclared/deep",
        dynamic: false,
      });
    });

    it("handles mixed declared and undeclared dynamic segments", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/users": { it: "/utenti", "/[userId]": {} } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/utenti/u1/posts/p1")).toEqual({
        value: "/users/u1/posts/p1",
        dynamic: true,
      });
    });

    it("handles path where only first segment is translated", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({ "/blog": { it: "/articoli" } }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/articoli/my-post/comments")).toEqual({
        value: "/blog/my-post/comments",
        dynamic: false,
      });
    });
  });

  describe("edge cases", () => {
    it("handles path with trailing slash", () => {
      const canonicalizer = new HrefCanonicalizer(aboutAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/about/")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("it", "/chi-siamo/")).toEqual({ value: "/about", dynamic: false });
    });

    it("handles path with double slashes", () => {
      const canonicalizer = new HrefCanonicalizer(aboutWithTeamAtlas, locales, defaultLocale);

      expect(canonicalizer.get("en", "/about//team")).toEqual({ value: "/about/team", dynamic: false });
      expect(canonicalizer.get("it", "/chi-siamo//staff")).toEqual({ value: "/about/team", dynamic: false });
    });

    it("handles URL-encoded segments as-is", () => {
      const canonicalizer = new HrefCanonicalizer(docsWithCatchAllAtlas, locales, defaultLocale);

      expect(canonicalizer.get("it", "/documenti/hello%20world")).toEqual({
        value: "/docs/hello%20world",
        dynamic: true,
      });
    });

    it("throws when path does not start with /", () => {
      const canonicalizer = new HrefCanonicalizer(createMockAtlas(), locales, defaultLocale);

      expect(() => canonicalizer.get("en", "about")).toThrow('Path must start with "/"');
      expect(() => canonicalizer.get("en", "")).toThrow('Path must start with "/"');
    });
  });

  describe("integration", () => {
    it("exercises multiple atlas patterns in a single canonicalizer", () => {
      const canonicalizer = new HrefCanonicalizer(
        createMockAtlas({
          "/about": { it: "/chi-siamo", "/team": { it: "/staff" } },
          "/docs": { it: "/documenti", "/[...slug]": {} },
          "/products": { it: "/prodotti", "/[id]": { "/reviews": { it: "/recensioni" } } },
        }),
        locales,
        defaultLocale
      );

      expect(canonicalizer.get("it", "/chi-siamo/staff")).toEqual({ value: "/about/team", dynamic: false });
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

  describe("adapters", () => {
    describe("preApply: true", () => {
      class HrefCanonicalizerWithPreAdapter extends HrefCanonicalizer {
        protected override readonly adapter = {
          fn: (_locale: string, path: string) => {
            const segments = path.split("/").filter((s) => s.length > 0);
            return `/${segments.slice(1).join("/")}`;
          },
          preApply: true as const,
        };
      }

      it("strips first segment before canonicalization", () => {
        const canonicalizer = new HrefCanonicalizerWithPreAdapter(aboutAtlas, locales, defaultLocale);

        expect(canonicalizer.get("en", "/en/about")).toEqual({ value: "/about", dynamic: false });
        expect(canonicalizer.get("it", "/it/chi-siamo")).toEqual({ value: "/about", dynamic: false });
      });

      it("strips first segment for dynamic paths", () => {
        const canonicalizer = new HrefCanonicalizerWithPreAdapter(productsAtlas, locales, defaultLocale);

        expect(canonicalizer.get("en", "/en/products/123")).toEqual({ value: "/products/123", dynamic: true });
        expect(canonicalizer.get("it", "/it/prodotti/456")).toEqual({ value: "/products/456", dynamic: true });
      });
    });

    describe("preApply: false", () => {
      class HrefCanonicalizerWithPostAdapter extends HrefCanonicalizer {
        protected override readonly adapter = {
          fn: (locale: string, path: string) => `/${locale}${path}`,
          preApply: false as const,
        };
      }

      it("transforms result with locale prefix", () => {
        const canonicalizer = new HrefCanonicalizerWithPostAdapter(aboutAtlas, locales, defaultLocale);

        expect(canonicalizer.get("en", "/about")).toEqual({ value: "/en/about", dynamic: false });
        expect(canonicalizer.get("it", "/chi-siamo")).toEqual({ value: "/it/about", dynamic: false });
      });

      it("transforms result for dynamic paths", () => {
        const canonicalizer = new HrefCanonicalizerWithPostAdapter(productsAtlas, locales, defaultLocale);

        expect(canonicalizer.get("en", "/products/123")).toEqual({ value: "/en/products/123", dynamic: true });
        expect(canonicalizer.get("it", "/prodotti/456")).toEqual({ value: "/it/products/456", dynamic: true });
      });
    });
  });
});

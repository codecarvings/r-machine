import { describe, expect, it } from "vitest";
import { getTranslatedHref, HrefTranslator } from "../../../src/core/href-translator.js";
import {
  aboutAtlas,
  aboutWithTeamAtlas,
  createMockAtlas,
  docsWithCatchAllAtlas,
  docsWithOptionalCatchAllAtlas,
  productsAtlas,
} from "./_helpers.js";

describe("getTranslatedHref", () => {
  describe("static segments", () => {
    it("returns root path for empty mapped segments", () => {
      expect(getTranslatedHref("en", "/", [])).toBe("/");
    });

    it("returns path with static segments", () => {
      const mappedSegments = [
        { decl: true, segment: "about", kind: "static" as const },
        { decl: true, segment: "team", kind: "static" as const },
      ];
      expect(getTranslatedHref("en", "/about/team", mappedSegments)).toBe("/about/team");
    });
  });

  describe("dynamic segments", () => {
    it("substitutes dynamic segment with param value", () => {
      const mappedSegments = [
        { decl: true, segment: "products", kind: "static" as const },
        { decl: true, segment: "id", kind: "dynamic" as const },
      ];
      expect(getTranslatedHref("en", "/products/[id]", mappedSegments, { id: "123" })).toBe("/products/123");
    });

    it("encodes param values", () => {
      const mappedSegments = [{ decl: true, segment: "query", kind: "dynamic" as const }];
      expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "hello world" })).toBe("/hello%20world");
    });

    it("converts numeric param values to string", () => {
      const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
      expect(getTranslatedHref("en", "/[id]", mappedSegments, { id: 12345 })).toBe("/12345");
    });

    it("encodes special URL characters in param values", () => {
      const mappedSegments = [{ decl: true, segment: "query", kind: "dynamic" as const }];

      expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a/b" })).toBe("/a%2Fb");
      expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a?b=c" })).toBe("/a%3Fb%3Dc");
      expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a#section" })).toBe("/a%23section");
      expect(getTranslatedHref("en", "/[query]", mappedSegments, { query: "a&b=1" })).toBe("/a%26b%3D1");
    });

    it("encodes unicode characters in param values", () => {
      const mappedSegments = [{ decl: true, segment: "name", kind: "dynamic" as const }];
      expect(getTranslatedHref("it", "/[name]", mappedSegments, { name: "caffè" })).toBe("/caff%C3%A8");
    });

    it("handles multiple dynamic segments", () => {
      const mappedSegments = [
        { decl: true, segment: "category", kind: "dynamic" as const },
        { decl: true, segment: "productId", kind: "dynamic" as const },
        { decl: true, segment: "variant", kind: "dynamic" as const },
      ];
      expect(
        getTranslatedHref("en", "/[category]/[productId]/[variant]", mappedSegments, {
          category: "electronics",
          productId: "phone-123",
          variant: "black",
        })
      ).toBe("/electronics/phone-123/black");
    });

    it("handles mixed static and dynamic segments", () => {
      const mappedSegments = [
        { decl: true, segment: "shop", kind: "static" as const },
        { decl: true, segment: "category", kind: "dynamic" as const },
        { decl: true, segment: "items", kind: "static" as const },
        { decl: true, segment: "id", kind: "dynamic" as const },
      ];
      expect(
        getTranslatedHref("en", "/shop/[category]/items/[id]", mappedSegments, {
          category: "books",
          id: "42",
        })
      ).toBe("/shop/books/items/42");
    });

    it("handles static segment after dynamic segment", () => {
      const mappedSegments = [
        { decl: true, segment: "id", kind: "dynamic" as const },
        { decl: true, segment: "edit", kind: "static" as const },
      ];
      expect(getTranslatedHref("en", "/[id]/edit", mappedSegments, { id: "123" })).toBe("/123/edit");
    });

    it("handles deeply nested path with all segment types", () => {
      const mappedSegments = [
        { decl: true, segment: "api", kind: "static" as const },
        { decl: true, segment: "version", kind: "dynamic" as const },
        { decl: true, segment: "resources", kind: "static" as const },
        { decl: true, segment: "path", kind: "catchAll" as const },
      ];
      expect(
        getTranslatedHref("en", "/api/[version]/resources/[...path]", mappedSegments, {
          version: "v2",
          path: ["users", "123", "posts"],
        })
      ).toBe("/api/v2/resources/users/123/posts");
    });
  });

  describe("catch-all segments", () => {
    it("substitutes catch-all segment with array values", () => {
      const mappedSegments = [
        { decl: true, segment: "docs", kind: "static" as const },
        { decl: true, segment: "path", kind: "catchAll" as const },
      ];
      expect(
        getTranslatedHref("en", "/docs/[...path]", mappedSegments, {
          path: ["getting-started", "installation"],
        })
      ).toBe("/docs/getting-started/installation");
    });

    it("substitutes optional catch-all segment with array values", () => {
      const mappedSegments = [
        { decl: true, segment: "docs", kind: "static" as const },
        { decl: true, segment: "path", kind: "optionalCatchAll" as const },
      ];
      expect(getTranslatedHref("en", "/docs/[[...path]]", mappedSegments, { path: ["intro"] })).toBe("/docs/intro");
    });

    it("handles catch-all with single element array", () => {
      const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
      expect(getTranslatedHref("en", "/[...path]", mappedSegments, { path: ["single"] })).toBe("/single");
    });

    it("handles catch-all with many elements", () => {
      const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
      expect(getTranslatedHref("en", "/[...path]", mappedSegments, { path: ["a", "b", "c", "d", "e"] })).toBe(
        "/a/b/c/d/e"
      );
    });

    it("encodes values in catch-all arrays", () => {
      const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
      expect(getTranslatedHref("en", "/[...path]", mappedSegments, { path: ["hello world", "foo/bar"] })).toBe(
        "/hello%20world/foo%2Fbar"
      );
    });

    it("handles empty catch-all array", () => {
      const mappedSegments = [
        { decl: true, segment: "docs", kind: "static" as const },
        { decl: true, segment: "path", kind: "catchAll" as const },
      ];
      expect(getTranslatedHref("en", "/docs/[...path]", mappedSegments, { path: [] })).toBe("/docs");
    });

    it("handles empty optional catch-all array", () => {
      const mappedSegments = [
        { decl: true, segment: "docs", kind: "static" as const },
        { decl: true, segment: "path", kind: "optionalCatchAll" as const },
      ];
      expect(getTranslatedHref("en", "/docs/[[...path]]", mappedSegments, { path: [] })).toBe("/docs");
    });
  });

  describe("error handling", () => {
    it("throws when dynamic param is missing", () => {
      const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
      expect(() => getTranslatedHref("en", "/[id]", mappedSegments, {})).toThrow(/parameter "id" is missing/);
    });

    it("throws when params object is undefined for dynamic segment", () => {
      const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
      expect(() => getTranslatedHref("en", "/[id]", mappedSegments, undefined)).toThrow(/parameter "id" is missing/);
    });

    it("throws when catch-all param is not an array", () => {
      const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
      expect(() => getTranslatedHref("en", "/[...path]", mappedSegments, { path: "not-array" })).toThrow(
        /parameter "path" is expected to be an array/
      );
    });

    it("throws when optional catch-all param is not an array", () => {
      const mappedSegments = [{ decl: true, segment: "path", kind: "optionalCatchAll" as const }];
      expect(() => getTranslatedHref("en", "/[[...path]]", mappedSegments, { path: "not-array" })).toThrow(
        /parameter "path" is expected to be an array/
      );
    });

    it("throws when param value results in empty segment", () => {
      const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
      expect(() => getTranslatedHref("en", "/[id]", mappedSegments, { id: "" })).toThrow(/empty path segment/);
    });

    it("throws when catch-all array contains empty string", () => {
      const mappedSegments = [{ decl: true, segment: "path", kind: "catchAll" as const }];
      expect(() => getTranslatedHref("en", "/[...path]", mappedSegments, { path: ["valid", ""] })).toThrow(
        /empty path segment/
      );
    });

    it("includes locale and path info in error message", () => {
      const mappedSegments = [{ decl: true, segment: "id", kind: "dynamic" as const }];
      expect(() => getTranslatedHref("it", "/users/[id]", mappedSegments, {})).toThrow(
        /Cannot translate path "\/users\/\[id\]" for locale "it"/
      );
    });
  });
});

describe("HrefTranslator", () => {
  const locales = ["en", "it"];
  const defaultLocale = "en";

  describe("static paths", () => {
    it("translates root path", () => {
      const translator = new HrefTranslator(createMockAtlas(), locales, defaultLocale);

      expect(translator.get("en", "/", {})).toEqual({ value: "/", dynamic: false });
      expect(translator.get("it", "/", {})).toEqual({ value: "/", dynamic: false });
    });

    it("translates simple static path", () => {
      const translator = new HrefTranslator(aboutAtlas, locales, defaultLocale);

      expect(translator.get("en", "/about", {})).toEqual({ value: "/about", dynamic: false });
      expect(translator.get("it", "/about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
    });

    it("translates nested static path", () => {
      const translator = new HrefTranslator(aboutWithTeamAtlas, locales, defaultLocale);

      expect(translator.get("en", "/about/team", {})).toEqual({ value: "/about/team", dynamic: false });
      expect(translator.get("it", "/about/team", {})).toEqual({ value: "/chi-siamo/staff", dynamic: false });
    });

    it("preserves segment order in complex nested paths", () => {
      const translator = new HrefTranslator(
        createMockAtlas({
          "/a": { it: "/uno", "/b": { it: "/due", "/c": { it: "/tre" } } },
        }),
        locales,
        defaultLocale
      );

      expect(translator.get("en", "/a/b/c", {})).toEqual({ value: "/a/b/c", dynamic: false });
      expect(translator.get("it", "/a/b/c", {})).toEqual({ value: "/uno/due/tre", dynamic: false });
    });

    it("uses canonical path when locale has no translation", () => {
      const translator = new HrefTranslator(createMockAtlas({ "/contact": {} }), locales, defaultLocale);

      expect(translator.get("en", "/contact", {})).toEqual({ value: "/contact", dynamic: false });
      expect(translator.get("it", "/contact", {})).toEqual({ value: "/contact", dynamic: false });
    });
  });

  describe("dynamic paths", () => {
    it("translates path with dynamic segment", () => {
      const translator = new HrefTranslator(productsAtlas, locales, defaultLocale);

      expect(translator.get("en", "/products/[id]", { id: "123" })).toEqual({
        value: "/products/123",
        dynamic: true,
      });
      expect(translator.get("it", "/products/[id]", { id: "456" })).toEqual({
        value: "/prodotti/456",
        dynamic: true,
      });
    });

    it("translates path with catch-all segment", () => {
      const translator = new HrefTranslator(docsWithCatchAllAtlas, locales, defaultLocale);

      expect(translator.get("en", "/docs/[...slug]", { slug: ["intro", "getting-started"] })).toEqual({
        value: "/docs/intro/getting-started",
        dynamic: true,
      });
      expect(translator.get("it", "/docs/[...slug]", { slug: ["guida"] })).toEqual({
        value: "/documenti/guida",
        dynamic: true,
      });
    });

    it("translates path with optional catch-all segment", () => {
      const translator = new HrefTranslator(docsWithOptionalCatchAllAtlas, locales, defaultLocale);

      expect(translator.get("en", "/docs/[[...slug]]", { slug: ["guide"] })).toEqual({
        value: "/docs/guide",
        dynamic: true,
      });
      expect(translator.get("it", "/docs/[[...slug]]", { slug: ["guida", "intro"] })).toEqual({
        value: "/documenti/guida/intro",
        dynamic: true,
      });
    });

    it("translates deeply nested path (4 levels)", () => {
      const translator = new HrefTranslator(
        createMockAtlas({
          "/api": { "/v1": { "/users": { it: "/utenti", "/[id]": { "/profile": { it: "/profilo" } } } } },
        }),
        locales,
        defaultLocale
      );

      expect(translator.get("en", "/api/v1/users/[id]/profile", { id: "123" })).toEqual({
        value: "/api/v1/users/123/profile",
        dynamic: true,
      });
      expect(translator.get("it", "/api/v1/users/[id]/profile", { id: "456" })).toEqual({
        value: "/api/v1/utenti/456/profilo",
        dynamic: true,
      });
    });

    it("handles multiple dynamic segments in declared path", () => {
      const translator = new HrefTranslator(
        createMockAtlas({ "/shop": { it: "/negozio", "/[category]": { "/[productId]": {} } } }),
        locales,
        defaultLocale
      );

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

    it("handles path with only dynamic segments", () => {
      const translator = new HrefTranslator(
        createMockAtlas({ "/[category]": { "/[id]": {} } }),
        locales,
        defaultLocale
      );

      expect(translator.get("en", "/[category]/[id]", { category: "books", id: "123" })).toEqual({
        value: "/books/123",
        dynamic: true,
      });
    });

    it("translates static segment after dynamic", () => {
      const translator = new HrefTranslator(
        createMockAtlas({
          "/users": { it: "/utenti", "/[id]": { "/settings": { it: "/impostazioni" } } },
        }),
        locales,
        defaultLocale
      );

      expect(translator.get("en", "/users/[id]/settings", { id: "42" })).toEqual({
        value: "/users/42/settings",
        dynamic: true,
      });
      expect(translator.get("it", "/users/[id]/settings", { id: "42" })).toEqual({
        value: "/utenti/42/impostazioni",
        dynamic: true,
      });
    });

    it("produces consistent results across repeated dynamic calls", () => {
      const translator = new HrefTranslator(productsAtlas, locales, defaultLocale);

      const result1 = translator.get("it", "/products/[id]", { id: "first" });
      const result2 = translator.get("it", "/products/[id]", { id: "second" });

      expect(result1).toEqual({ value: "/prodotti/first", dynamic: true });
      expect(result2).toEqual({ value: "/prodotti/second", dynamic: true });
    });

    it("handles mixed declared and undeclared dynamic segments", () => {
      const translator = new HrefTranslator(
        createMockAtlas({ "/users": { it: "/utenti", "/[userId]": {} } }),
        locales,
        defaultLocale
      );

      expect(
        translator.get("it", "/users/[userId]/posts/[postId]", {
          userId: "u1",
          postId: "p1",
        })
      ).toEqual({ value: "/utenti/u1/posts/p1", dynamic: true });
    });
  });

  describe("undeclared paths", () => {
    it("handles undeclared path segments as-is", () => {
      const translator = new HrefTranslator(aboutAtlas, locales, defaultLocale);

      expect(translator.get("en", "/about/unknown", {})).toEqual({
        value: "/about/unknown",
        dynamic: false,
      });
      expect(translator.get("it", "/about/unknown", {})).toEqual({
        value: "/chi-siamo/unknown",
        dynamic: false,
      });
    });

    it("handles completely undeclared path", () => {
      const translator = new HrefTranslator(createMockAtlas(), locales, defaultLocale);

      expect(translator.get("en", "/unknown/path", {})).toEqual({ value: "/unknown/path", dynamic: false });
    });

    it("handles undeclared dynamic segment in path", () => {
      const translator = new HrefTranslator(createMockAtlas(), locales, defaultLocale);

      expect(translator.get("en", "/users/[id]", { id: "42" })).toEqual({
        value: "/users/42",
        dynamic: true,
      });
    });

    it("handles partial path match where later segments are undeclared", () => {
      const translator = new HrefTranslator(
        createMockAtlas({ "/blog": { it: "/articoli", "/posts": { it: "/post" } } }),
        locales,
        defaultLocale
      );

      expect(translator.get("it", "/blog/posts/undeclared/deep", {})).toEqual({
        value: "/articoli/post/undeclared/deep",
        dynamic: false,
      });
    });

    it("handles undeclared catch-all segment in path", () => {
      const translator = new HrefTranslator(createMockAtlas(), locales, defaultLocale);

      expect(translator.get("en", "/docs/[...path]", { path: ["a", "b", "c"] })).toEqual({
        value: "/docs/a/b/c",
        dynamic: true,
      });
    });

    it("handles undeclared optional catch-all segment", () => {
      const translator = new HrefTranslator(createMockAtlas(), locales, defaultLocale);

      expect(translator.get("en", "/docs/[[...path]]", { path: ["a", "b"] })).toEqual({
        value: "/docs/a/b",
        dynamic: true,
      });
    });
  });

  describe("edge cases", () => {
    it("handles path with trailing slash", () => {
      const translator = new HrefTranslator(aboutAtlas, locales, defaultLocale);

      expect(translator.get("en", "/about/", {})).toEqual({ value: "/about", dynamic: false });
      expect(translator.get("it", "/about/", {})).toEqual({ value: "/chi-siamo", dynamic: false });
    });

    it("handles path with double slashes", () => {
      const translator = new HrefTranslator(aboutWithTeamAtlas, locales, defaultLocale);

      expect(translator.get("en", "/about//team", {})).toEqual({ value: "/about/team", dynamic: false });
      expect(translator.get("it", "/about//team", {})).toEqual({ value: "/chi-siamo/staff", dynamic: false });
    });

    it("throws when path does not start with /", () => {
      const translator = new HrefTranslator(createMockAtlas(), locales, defaultLocale);

      expect(() => translator.get("en", "about", {})).toThrow(/Path must start with "\/"/);
    });
  });

  describe("adapters", () => {
    describe("preApply: true", () => {
      class HrefTranslatorWithPreAdapter extends HrefTranslator {
        protected override readonly adapter = {
          fn: (_locale: string, path: string) => {
            const segments = path.split("/").filter((s) => s.length > 0);
            return `/${segments.slice(1).join("/")}`;
          },
          preApply: true as const,
        };
      }

      it("strips first segment before translation", () => {
        const translator = new HrefTranslatorWithPreAdapter(aboutAtlas, locales, defaultLocale);

        expect(translator.get("en", "/en/about", {})).toEqual({ value: "/about", dynamic: false });
        expect(translator.get("it", "/it/about", {})).toEqual({ value: "/chi-siamo", dynamic: false });
      });

      it("strips first segment for dynamic paths", () => {
        const translator = new HrefTranslatorWithPreAdapter(productsAtlas, locales, defaultLocale);

        expect(translator.get("en", "/en/products/[id]", { id: "123" })).toEqual({
          value: "/products/123",
          dynamic: true,
        });
        expect(translator.get("it", "/it/products/[id]", { id: "456" })).toEqual({
          value: "/prodotti/456",
          dynamic: true,
        });
      });
    });

    describe("preApply: false", () => {
      class HrefTranslatorWithPostAdapter extends HrefTranslator {
        protected override readonly adapter = {
          fn: (locale: string, path: string) => `/${locale}${path}`,
          preApply: false as const,
        };
      }

      it("transforms result after translation with locale prefix", () => {
        const translator = new HrefTranslatorWithPostAdapter(aboutAtlas, locales, defaultLocale);

        expect(translator.get("en", "/about", {})).toEqual({ value: "/en/about", dynamic: false });
        expect(translator.get("it", "/about", {})).toEqual({ value: "/it/chi-siamo", dynamic: false });
      });

      it("transforms result for dynamic paths", () => {
        const translator = new HrefTranslatorWithPostAdapter(productsAtlas, locales, defaultLocale);

        expect(translator.get("en", "/products/[id]", { id: "123" })).toEqual({
          value: "/en/products/123",
          dynamic: true,
        });
        expect(translator.get("it", "/products/[id]", { id: "456" })).toEqual({
          value: "/it/prodotti/456",
          dynamic: true,
        });
      });
    });
  });

  describe("integration", () => {
    it("exercises multiple atlas patterns in a single translator", () => {
      const translator = new HrefTranslator(
        createMockAtlas({
          "/about": { it: "/chi-siamo", "/team": { it: "/staff" } },
          "/docs": { it: "/documenti", "/[...slug]": {} },
          "/products": { it: "/prodotti", "/[id]": { "/reviews": { it: "/recensioni" } } },
        }),
        locales,
        defaultLocale
      );

      expect(translator.get("it", "/about/team", {})).toEqual({ value: "/chi-siamo/staff", dynamic: false });
      expect(translator.get("it", "/docs/[...slug]", { slug: ["intro", "start"] })).toEqual({
        value: "/documenti/intro/start",
        dynamic: true,
      });
      expect(translator.get("it", "/products/[id]/reviews", { id: "123" })).toEqual({
        value: "/prodotti/123/recensioni",
        dynamic: true,
      });
    });
  });
});

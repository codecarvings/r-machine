import { describe, expect, it, vi } from "vitest";
import {
  buildPathAtlasSegmentTree,
  getSegmentData,
  HrefMapper,
  type MappedHrefResult,
} from "../../src/core/href-mapper.js";
import type { AnyPathAtlasProvider } from "../../src/core/path-atlas.js";
import { createMockAtlas } from "../_fixtures/_helpers.js";

describe("getSegmentData", () => {
  it.each([
    ["empty string", "", undefined, undefined],
    ["static segment", "about", "static", undefined],
    ["dynamic segment", "[slug]", "dynamic", "slug"],
    ["catch-all segment", "[...path]", "catchAll", "path"],
    ["optional catch-all segment", "[[...path]]", "optionalCatchAll", "path"],
  ])("parses %s", (_label, input, expectedKind, expectedParamKey) => {
    const result = getSegmentData(input);
    expect(result.kind).toBe(expectedKind);
    expect(result.paramKey).toBe(expectedParamKey);
  });

  it("treats malformed segments as static with no paramKey", () => {
    for (const segment of ["[incomplete", "incomplete]", "[...incomplete", "[[...incomplete"]) {
      const result = getSegmentData(segment);
      expect(result.kind).toBe("static");
      expect(result.paramKey).toBeUndefined();
    }
  });
});

describe("buildPathAtlasSegmentTree", () => {
  const locales = ["en", "it", "fr"];
  const defaultLocale = "en";

  describe("translations", () => {
    it("uses segment name as default translation for all locales", () => {
      const tree = buildPathAtlasSegmentTree("about", {}, locales, defaultLocale);

      expect(tree.kind).toBe("static");
      expect(tree.paramKey).toBeUndefined();
      expect(tree.translations).toEqual({
        en: "about",
        it: "about",
        fr: "about",
      });
      expect(tree.children).toEqual({});
    });

    it("applies locale-specific translations", () => {
      const tree = buildPathAtlasSegmentTree("about", { it: "/chi-siamo", fr: "/apropos" }, locales, defaultLocale);

      expect(tree.translations).toEqual({
        en: "about",
        it: "chi-siamo",
        fr: "apropos",
      });
    });

    it("falls back to segment name for locales without translations", () => {
      const tree = buildPathAtlasSegmentTree("contact", { it: "/contatti" }, locales, defaultLocale);

      expect(tree.translations.en).toBe("contact");
      expect(tree.translations.it).toBe("contatti");
      expect(tree.translations.fr).toBe("contact");
    });

    it("preserves segment name in child translations for all locales by default", () => {
      const tree = buildPathAtlasSegmentTree("root", { "/special-page": {} }, locales, defaultLocale);

      expect(tree.children["special-page"].translations).toEqual({
        en: "special-page",
        it: "special-page",
        fr: "special-page",
      });
    });

    it("handles both translations and children on the same segment", () => {
      const tree = buildPathAtlasSegmentTree(
        "blog",
        {
          it: "/blog",
          fr: "/blogue",
          "/[slug]": {},
          "/categories": { it: "/categorie" },
        },
        locales,
        defaultLocale
      );

      expect(tree.translations).toEqual({ en: "blog", it: "blog", fr: "blogue" });
      expect(tree.children["[slug]"].kind).toBe("dynamic");
      expect(tree.children.categories.translations.it).toBe("categorie");
    });
  });

  describe("children", () => {
    it("builds child segments with translations", () => {
      const tree = buildPathAtlasSegmentTree(
        "about",
        { "/team": { it: "/staff" }, "/contact": {} },
        locales,
        defaultLocale
      );

      expect(tree.children).toHaveProperty("team");
      expect(tree.children).toHaveProperty("contact");
      expect(tree.children.team.translations.it).toBe("staff");
      expect(tree.children.contact.translations.en).toBe("contact");
    });

    it("builds dynamic segment children", () => {
      const tree = buildPathAtlasSegmentTree("products", { "/[id]": {} }, locales, defaultLocale);

      expect(tree.children["[id]"].kind).toBe("dynamic");
      expect(tree.children["[id]"].paramKey).toBe("id");
    });

    it("builds catch-all segment children", () => {
      const tree = buildPathAtlasSegmentTree("docs", { "/[...slug]": {} }, locales, defaultLocale);

      expect(tree.children["[...slug]"].kind).toBe("catchAll");
      expect(tree.children["[...slug]"].paramKey).toBe("slug");
    });

    it("builds optional catch-all segment children", () => {
      const tree = buildPathAtlasSegmentTree("docs", { "/[[...path]]": {} }, locales, defaultLocale);

      expect(tree.children["[[...path]]"].kind).toBe("optionalCatchAll");
      expect(tree.children["[[...path]]"].paramKey).toBe("path");
    });

    it("builds mixed static and dynamic children", () => {
      const tree = buildPathAtlasSegmentTree(
        "account",
        {
          "/overview": { it: "/panoramica" },
          "/[id]": {},
          "/settings": { it: "/impostazioni" },
        },
        locales,
        defaultLocale
      );

      expect(Object.keys(tree.children)).toHaveLength(3);
      expect(tree.children.overview.kind).toBe("static");
      expect(tree.children.overview.translations.it).toBe("panoramica");
      expect(tree.children["[id]"].kind).toBe("dynamic");
      expect(tree.children["[id]"].paramKey).toBe("id");
      expect(tree.children.settings.kind).toBe("static");
      expect(tree.children.settings.translations.it).toBe("impostazioni");
    });
  });

  describe("nesting", () => {
    it("builds nested tree structure", () => {
      const tree = buildPathAtlasSegmentTree(
        "",
        {
          "/products": {
            it: "/prodotti",
            "/[id]": {
              "/reviews": { it: "/recensioni" },
            },
          },
        },
        locales,
        defaultLocale
      );

      expect(tree.children.products.translations.it).toBe("prodotti");
      expect(tree.children.products.children["[id]"].kind).toBe("dynamic");
      expect(tree.children.products.children["[id]"].children.reviews.translations.it).toBe("recensioni");
    });

    it("builds deeply nested tree (4 levels)", () => {
      const tree = buildPathAtlasSegmentTree(
        "",
        {
          "/api": {
            "/v1": {
              "/users": {
                it: "/utenti",
                "/[id]": {
                  "/profile": { it: "/profilo" },
                },
              },
            },
          },
        },
        locales,
        defaultLocale
      );

      const profile = tree.children.api.children.v1.children.users.children["[id]"].children.profile;
      expect(profile.kind).toBe("static");
      expect(profile.translations.it).toBe("profilo");
      expect(profile.translations.en).toBe("profile");
    });

    it("builds multiple dynamic segments at different levels", () => {
      const tree = buildPathAtlasSegmentTree(
        "shop",
        {
          "/[category]": {
            "/[productId]": {
              "/[variant]": {},
            },
          },
        },
        locales,
        defaultLocale
      );

      expect(tree.children["[category]"].kind).toBe("dynamic");
      expect(tree.children["[category]"].paramKey).toBe("category");
      expect(tree.children["[category]"].children["[productId]"].kind).toBe("dynamic");
      expect(tree.children["[category]"].children["[productId]"].paramKey).toBe("productId");
      expect(tree.children["[category]"].children["[productId]"].children["[variant]"].kind).toBe("dynamic");
      expect(tree.children["[category]"].children["[productId]"].children["[variant]"].paramKey).toBe("variant");
    });
  });

  describe("edge cases", () => {
    it("builds root segment with undefined kind", () => {
      const tree = buildPathAtlasSegmentTree("", {}, locales, defaultLocale);

      expect(tree.kind).toBeUndefined();
      expect(tree.paramKey).toBeUndefined();
      expect(tree.translations).toEqual({ en: "", it: "", fr: "" });
    });

    it("handles single locale configuration", () => {
      const tree = buildPathAtlasSegmentTree("about", {}, ["en"], "en");

      expect(tree.translations).toEqual({ en: "about" });
    });
  });
});

type TestHrefMapperFn = (locale: string, path: string) => MappedHrefResult;

class TestHrefMapper extends HrefMapper<TestHrefMapperFn> {
  constructor(
    atlas: AnyPathAtlasProvider,
    locales: readonly string[],
    defaultLocale: string,
    private readonly computeFn: TestHrefMapperFn
  ) {
    super(atlas, locales, defaultLocale);
  }

  protected readonly compute: TestHrefMapperFn = (locale, path) => {
    return this.computeFn(locale, path);
  };
}

class TestHrefMapperWithAdapter extends TestHrefMapper {
  protected override readonly adapter;

  constructor(
    atlas: AnyPathAtlasProvider,
    locales: readonly string[],
    defaultLocale: string,
    computeFn: TestHrefMapperFn,
    adapter: { fn: (locale: string, path: string) => string; preApply: boolean }
  ) {
    super(atlas, locales, defaultLocale, computeFn);
    this.adapter = adapter;
  }
}

describe("HrefMapper", () => {
  const locales = ["en", "it", "fr"] as const;
  const defaultLocale = "en";

  describe("constructor", () => {
    it("exposes locales and defaultLocale", () => {
      const atlas = createMockAtlas();
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, () => ({
        value: "/test",
        dynamic: false,
      }));

      expect(mapper.locales).toEqual(locales);
      expect(mapper.defaultLocale).toBe(defaultLocale);
    });
  });

  describe("get", () => {
    it("calls compute with locale and path", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({ value: "/mapped", dynamic: false }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledWith("en", "/test");
    });

    it("caches non-dynamic results", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({ value: "/mapped", dynamic: false }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      const result1 = mapper.get("en", "/test");
      const result2 = mapper.get("en", "/test");

      expect(result1).toBe(result2);
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    it("does not cache dynamic results", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({ value: "/mapped", dynamic: true }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      mapper.get("en", "/test");
      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    it("maintains separate caches per locale", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn((locale: string) => ({
        value: `/${locale}/mapped`,
        dynamic: false,
      }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      const enResult = mapper.get("en", "/test");
      const itResult = mapper.get("it", "/test");

      expect(enResult.value).toBe("/en/mapped");
      expect(itResult.value).toBe("/it/mapped");
      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    it("returns cached result on subsequent calls for same locale/path", () => {
      const atlas = createMockAtlas();
      let callCount = 0;
      const computeFn = vi.fn(() => {
        callCount++;
        return { value: `/result-${callCount}`, dynamic: false };
      });
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      const result1 = mapper.get("en", "/page");
      const result2 = mapper.get("en", "/page");
      const result3 = mapper.get("en", "/other");

      expect(result1.value).toBe("/result-1");
      expect(result2.value).toBe("/result-1");
      expect(result3.value).toBe("/result-2");
    });
  });

  describe("adapter with preApply: true", () => {
    it("transforms input path before compute", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn((_, path: string) => ({
        value: path,
        dynamic: false,
      }));
      const adapter = {
        fn: (_locale: string, path: string) => `/prefixed${path}`,
        preApply: true,
      };
      const mapper = new TestHrefMapperWithAdapter(atlas, locales, defaultLocale, computeFn, adapter);

      const result = mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledWith("en", "/prefixed/test");
      expect(result.value).toBe("/prefixed/test");
    });

    it("caches with original path as key", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn((_, path: string) => ({
        value: path,
        dynamic: false,
      }));
      const adapter = {
        fn: (_locale: string, path: string) => `/transformed${path}`,
        preApply: true,
      };
      const mapper = new TestHrefMapperWithAdapter(atlas, locales, defaultLocale, computeFn, adapter);

      mapper.get("en", "/test");
      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("adapter with preApply: false", () => {
    it("transforms result after compute", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({
        value: "/computed",
        dynamic: false,
      }));
      const adapter = {
        fn: (locale: string, path: string) => `/${locale}${path}`,
        preApply: false,
      };
      const mapper = new TestHrefMapperWithAdapter(atlas, locales, defaultLocale, computeFn, adapter);

      const result = mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledWith("en", "/test");
      expect(result.value).toBe("/en/computed");
    });

    it("preserves dynamic flag from compute result", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({
        value: "/computed",
        dynamic: true,
      }));
      const adapter = {
        fn: (locale: string, path: string) => `/${locale}${path}`,
        preApply: false,
      };
      const mapper = new TestHrefMapperWithAdapter(atlas, locales, defaultLocale, computeFn, adapter);

      const result = mapper.get("en", "/test");

      expect(result.dynamic).toBe(true);
      expect(result.value).toBe("/en/computed");
    });

    it("does not cache dynamic results with post-adapter", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({
        value: "/computed",
        dynamic: true,
      }));
      const adapter = {
        fn: (locale: string, path: string) => `/${locale}${path}`,
        preApply: false,
      };
      const mapper = new TestHrefMapperWithAdapter(atlas, locales, defaultLocale, computeFn, adapter);

      mapper.get("en", "/test");
      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledTimes(2);
    });
  });
});

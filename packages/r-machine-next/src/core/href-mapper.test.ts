import { describe, expect, test, vi } from "vitest";
import { buildPathAtlasSegmentTree, getSegmentData, HrefMapper, type MappedHrefResult } from "./href-mapper.js";
import type { AnyPathAtlas } from "./path-atlas.js";

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

type TestHrefMapperFn = (locale: string, path: string) => MappedHrefResult;

class TestHrefMapper extends HrefMapper<TestHrefMapperFn> {
  public computeFn: (locale: string, path: string) => MappedHrefResult;

  constructor(
    atlas: AnyPathAtlas,
    locales: readonly string[],
    defaultLocale: string,
    computeFn: (locale: string, path: string) => MappedHrefResult,
    adapter?: { fn: (locale: string, path: string) => string; preApply: boolean }
  ) {
    super(atlas, locales, defaultLocale);
    this.computeFn = computeFn;
    if (adapter) {
      (this as unknown as { adapter: typeof adapter }).adapter = adapter;
    }
  }

  protected readonly compute: TestHrefMapperFn = (locale, path) => {
    return this.computeFn(locale, path);
  };
}

describe("HrefMapper", () => {
  const locales = ["en", "it", "fr"] as const;
  const defaultLocale = "en";

  const createMockAtlas = (decl: object = {}): AnyPathAtlas => ({ decl });

  describe("constructor", () => {
    test("initializes caches for each locale", () => {
      const atlas = createMockAtlas();
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, () => ({
        value: "/test",
        dynamic: false,
      }));

      expect(mapper.locales).toEqual(locales);
      expect(mapper.defaultLocale).toBe(defaultLocale);
    });

    test("builds segmentDataTree from atlas declaration", () => {
      const atlas = createMockAtlas({
        "/about": {
          it: "/chi-siamo",
        },
      });
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, () => ({
        value: "/test",
        dynamic: false,
      }));

      expect((mapper as any).segmentDataTree.children.about).toBeDefined();
      expect((mapper as any).segmentDataTree.children.about.translations.it).toBe("chi-siamo");
    });
  });

  describe("get method", () => {
    test("calls compute with locale and path", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({ value: "/mapped", dynamic: false }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledWith("en", "/test");
    });

    test("caches non-dynamic results", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({ value: "/mapped", dynamic: false }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      const result1 = mapper.get("en", "/test");
      const result2 = mapper.get("en", "/test");

      expect(result1).toBe(result2);
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    test("does not cache dynamic results", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({ value: "/mapped", dynamic: true }));
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn);

      mapper.get("en", "/test");
      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledTimes(2);
    });

    test("maintains separate caches per locale", () => {
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

    test("returns cached result on subsequent calls for same locale/path", () => {
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
    test("transforms input path before compute", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn((_, path: string) => ({
        value: path,
        dynamic: false,
      }));
      const adapter = {
        fn: (_locale: string, path: string) => `/prefixed${path}`,
        preApply: true,
      };
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn, adapter);

      const result = mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledWith("en", "/prefixed/test");
      expect(result.value).toBe("/prefixed/test");
    });

    test("caches with original path as key", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn((_, path: string) => ({
        value: path,
        dynamic: false,
      }));
      const adapter = {
        fn: (_locale: string, path: string) => `/transformed${path}`,
        preApply: true,
      };
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn, adapter);

      mapper.get("en", "/test");
      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("adapter with preApply: false", () => {
    test("transforms result after compute", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({
        value: "/computed",
        dynamic: false,
      }));
      const adapter = {
        fn: (locale: string, path: string) => `/${locale}${path}`,
        preApply: false,
      };
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn, adapter);

      const result = mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledWith("en", "/test");
      expect(result.value).toBe("/en/computed");
    });

    test("preserves dynamic flag from compute result", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({
        value: "/computed",
        dynamic: true,
      }));
      const adapter = {
        fn: (locale: string, path: string) => `/${locale}${path}`,
        preApply: false,
      };
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn, adapter);

      const result = mapper.get("en", "/test");

      expect(result.dynamic).toBe(true);
      expect(result.value).toBe("/en/computed");
    });

    test("does not cache dynamic results with post-adapter", () => {
      const atlas = createMockAtlas();
      const computeFn = vi.fn(() => ({
        value: "/computed",
        dynamic: true,
      }));
      const adapter = {
        fn: (locale: string, path: string) => `/${locale}${path}`,
        preApply: false,
      };
      const mapper = new TestHrefMapper(atlas, locales, defaultLocale, computeFn, adapter);

      mapper.get("en", "/test");
      mapper.get("en", "/test");

      expect(computeFn).toHaveBeenCalledTimes(2);
    });
  });
});

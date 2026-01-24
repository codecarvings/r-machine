import { describe, expect, test } from "vitest";
import { buildPathAtlasSegmentTree, getSegmentData } from "./href-mapper.js";

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

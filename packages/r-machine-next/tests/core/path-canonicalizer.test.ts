import { describe, expect, it } from "vitest";
import { HrefCanonicalizer } from "../../src/core/href-canonicalizer.js";
import { PathCanonicalizer } from "../../src/core/path-canonicalizer.js";
import { aboutAtlas, createMockAtlas, productsAtlas } from "../_fixtures/_helpers.js";

describe("PathCanonicalizer", () => {
  const cLocales = ["en", "it"];
  const cDefaultLocale = "en";

  describe("extends HrefCanonicalizer", () => {
    it("is an instance of HrefCanonicalizer", () => {
      const canonicalizer = new PathCanonicalizer(createMockAtlas(), cLocales, cDefaultLocale, false);

      expect(canonicalizer).toBeInstanceOf(HrefCanonicalizer);
    });
  });

  describe("adapter", () => {
    it("has preApply set to true", () => {
      const canonicalizer = new PathCanonicalizer(createMockAtlas(), cLocales, cDefaultLocale, false);

      expect((canonicalizer as any).adapter.preApply).toBe(true);
    });
  });

  describe("strip locale prefix", () => {
    it('strips locale prefix and returns content path (e.g. "/en/about" → "/about")', () => {
      const canonicalizer = new PathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en/about")).toEqual({ value: "/about", dynamic: false });
      expect(canonicalizer.get("it", "/it/chi-siamo")).toEqual({ value: "/about", dynamic: false });
    });

    it('returns "/" when path has no content segment after locale (e.g. "/en")', () => {
      const canonicalizer = new PathCanonicalizer(createMockAtlas(), cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en")).toEqual({ value: "/", dynamic: false });
      expect(canonicalizer.get("it", "/it")).toEqual({ value: "/", dynamic: false });
    });

    it("handles paths with dynamic segments", () => {
      const canonicalizer = new PathCanonicalizer(productsAtlas, cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en/products/[id]")).toEqual({
        value: "/products/[id]",
        dynamic: true,
      });
    });
  });

  describe("implicitDefaultLocale", () => {
    it("returns path as-is for default locale when enabled", () => {
      const canonicalizer = new PathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, true);

      expect(canonicalizer.get("en", "/about")).toEqual({ value: "/about", dynamic: false });
    });

    it("still strips locale prefix for non-default locale when enabled", () => {
      const canonicalizer = new PathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, true);

      expect(canonicalizer.get("it", "/it/chi-siamo")).toEqual({ value: "/about", dynamic: false });
    });

    it("strips locale prefix for default locale when disabled", () => {
      const canonicalizer = new PathCanonicalizer(aboutAtlas, cLocales, cDefaultLocale, false);

      expect(canonicalizer.get("en", "/en/about")).toEqual({ value: "/about", dynamic: false });
    });

    it('returns "/" for root path of non-default locale when enabled', () => {
      const canonicalizer = new PathCanonicalizer(createMockAtlas(), cLocales, cDefaultLocale, true);

      expect(canonicalizer.get("it", "/it")).toEqual({ value: "/", dynamic: false });
    });
  });
});

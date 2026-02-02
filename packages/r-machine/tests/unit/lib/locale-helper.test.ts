import { describe, expect, it } from "vitest";

import { RMachineError } from "../../../src/errors/r-machine-error.js";
import { LocaleHelper } from "../../../src/lib/locale-helper.js";

const locales = ["en", "fr", "de", "it", "es"] as const;
const defaultLocale = "en";

function createHelper(locs: readonly string[] = locales, def: string = defaultLocale): LocaleHelper {
  return new LocaleHelper(locs, def);
}

describe("LocaleHelper", () => {
  describe("constructor", () => {
    it("creates an instance with locales and a default locale", () => {
      const helper = createHelper();
      expect(helper).toBeInstanceOf(LocaleHelper);
    });

    it("creates an instance with a single locale", () => {
      const helper = createHelper(["en"], "en");
      expect(helper).toBeInstanceOf(LocaleHelper);
    });
  });

  describe("matchLocales", () => {
    it("returns the first matching locale from requested locales", () => {
      const helper = createHelper();
      const result = helper.matchLocales(["fr", "de"]);
      expect(result).toBe("fr");
    });

    it("returns the default locale when no requested locales match", () => {
      const helper = createHelper();
      const result = helper.matchLocales(["ja", "ko"]);
      expect(result).toBe("en");
    });

    it("returns the default locale for an empty requested locales array", () => {
      const helper = createHelper();
      const result = helper.matchLocales([]);
      expect(result).toBe("en");
    });

    it("matches an exact locale", () => {
      const helper = createHelper();
      const result = helper.matchLocales(["de"]);
      expect(result).toBe("de");
    });

    it("respects the order of requested locales", () => {
      const helper = createHelper();
      const result1 = helper.matchLocales(["fr", "de"]);
      const result2 = helper.matchLocales(["de", "fr"]);
      expect(result1).toBe("fr");
      expect(result2).toBe("de");
    });

    it("falls back to the default locale with a non-matching list", () => {
      const helper = createHelper(["en", "fr"], "fr");
      const result = helper.matchLocales(["zh", "ja"]);
      expect(result).toBe("fr");
    });

    it("matches by language subtag when full tag is not available", () => {
      const helper = createHelper(["en", "fr"], "en");
      const result = helper.matchLocales(["fr-CA"]);
      expect(result).toBe("fr");
    });

    it("matches exact locale before language subtag fallback", () => {
      const helper = createHelper(["en", "en-GB", "fr"], "en");
      const result = helper.matchLocales(["en-GB"]);
      expect(result).toBe("en-GB");
    });

    it("works with the lookup algorithm", () => {
      const helper = createHelper();
      const result = helper.matchLocales(["fr"], "lookup");
      expect(result).toBe("fr");
    });

    it("works with the best-fit algorithm", () => {
      const helper = createHelper();
      const result = helper.matchLocales(["fr"], "best-fit");
      expect(result).toBe("fr");
    });

    it("skips wildcard * in requested locales", () => {
      const helper = createHelper();
      const result = helper.matchLocales(["*"]);
      expect(result).toBe("en");
    });

    it("handles locale with region subtag matching base language", () => {
      const helper = createHelper(["en", "es"], "en");
      const result = helper.matchLocales(["es-MX"]);
      expect(result).toBe("es");
    });

    it("handles case-insensitive matching", () => {
      const helper = createHelper(["en-US", "fr"], "en-US");
      const result = helper.matchLocales(["EN-us"]);
      expect(result).toBe("en-US");
    });
  });

  describe("matchLocalesForAcceptLanguageHeader", () => {
    it("parses and matches a simple Accept-Language header", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("fr");
      expect(result).toBe("fr");
    });

    it("parses a header with multiple locales and quality values", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("de;q=0.7, fr;q=0.9");
      expect(result).toBe("fr");
    });

    it("returns the default locale when header does not match any locale", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("ja, ko");
      expect(result).toBe("en");
    });

    it("returns the default locale for an empty string header", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("");
      expect(result).toBe("en");
    });

    it("returns the default locale for undefined header", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader(undefined);
      expect(result).toBe("en");
    });

    it("returns the default locale for null header", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader(null);
      expect(result).toBe("en");
    });

    it("respects quality ordering", () => {
      const helper = createHelper(["en", "fr", "de"], "en");
      const result = helper.matchLocalesForAcceptLanguageHeader("de;q=0.5, fr;q=0.9, en;q=0.1");
      expect(result).toBe("fr");
    });

    it("treats default quality as 1.0", () => {
      const helper = createHelper(["en", "fr"], "en");
      const result = helper.matchLocalesForAcceptLanguageHeader("fr, en;q=0.5");
      expect(result).toBe("fr");
    });

    it("handles a realistic browser Accept-Language header", () => {
      const helper = createHelper(["en", "fr", "de", "it", "es"], "en");
      const result = helper.matchLocalesForAcceptLanguageHeader("it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7");
      expect(result).toBe("it");
    });

    it("handles a header with whitespace", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("  fr  ,  de ; q=0.8  ");
      expect(result).toBe("fr");
    });

    it("skips entries with zero quality", () => {
      const helper = createHelper(["en", "fr"], "en");
      const result = helper.matchLocalesForAcceptLanguageHeader("fr;q=0, en");
      expect(result).toBe("en");
    });

    it("works with the lookup algorithm", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("fr", "lookup");
      expect(result).toBe("fr");
    });

    it("works with the best-fit algorithm", () => {
      const helper = createHelper();
      const result = helper.matchLocalesForAcceptLanguageHeader("fr", "best-fit");
      expect(result).toBe("fr");
    });

    it("handles header with region subtags matching base language", () => {
      const helper = createHelper(["en", "es"], "en");
      const result = helper.matchLocalesForAcceptLanguageHeader("es-AR;q=1.0");
      expect(result).toBe("es");
    });
  });

  describe("validateLocale", () => {
    it("returns null for a valid locale in the list", () => {
      const helper = createHelper();
      const result = helper.validateLocale("en");
      expect(result).toBeNull();
    });

    it("returns null for each locale in the list", () => {
      const helper = createHelper();
      for (const locale of locales) {
        expect(helper.validateLocale(locale)).toBeNull();
      }
    });

    it("returns an RMachineError for a locale not in the list", () => {
      const helper = createHelper();
      const result = helper.validateLocale("ja");
      expect(result).toBeInstanceOf(RMachineError);
    });

    it("returns an error with a descriptive message", () => {
      const helper = createHelper();
      const result = helper.validateLocale("ja");
      expect(result).not.toBeNull();
      expect(result!.message).toContain("ja");
    });

    it("returns null for an empty string", () => {
      const helper = createHelper(["", "en"], "en");
      const result = helper.validateLocale("");
      expect(result).toBeNull();
    });

    it("is case-sensitive", () => {
      const helper = createHelper(["en"], "en");
      const result = helper.validateLocale("EN");
      expect(result).toBeInstanceOf(RMachineError);
    });

    it("validates the default locale as valid", () => {
      const helper = createHelper(["en", "fr"], "en");
      expect(helper.validateLocale("en")).toBeNull();
    });

    it("handles locales with region subtags", () => {
      const helper = createHelper(["en-US", "en-GB"], "en-US");
      expect(helper.validateLocale("en-US")).toBeNull();
      expect(helper.validateLocale("en-GB")).toBeNull();
      expect(helper.validateLocale("en")).toBeInstanceOf(RMachineError);
    });

    it("handles a large locale list", () => {
      const many = Array.from({ length: 100 }, (_, i) => `locale-${i}`);
      const helper = createHelper(many, "locale-0");
      expect(helper.validateLocale("locale-0")).toBeNull();
      expect(helper.validateLocale("locale-99")).toBeNull();
      expect(helper.validateLocale("locale-100")).toBeInstanceOf(RMachineError);
    });

    it("handles duplicate locales in the list", () => {
      const helper = createHelper(["en", "en", "fr"], "en");
      expect(helper.validateLocale("en")).toBeNull();
      expect(helper.validateLocale("fr")).toBeNull();
    });
  });

  describe("integration", () => {
    it("matchLocales and validateLocale are consistent", () => {
      const helper = createHelper(["en", "fr", "de"], "en");
      const matched = helper.matchLocales(["fr"]);
      expect(helper.validateLocale(matched)).toBeNull();
    });

    it("matchLocalesForAcceptLanguageHeader and validateLocale are consistent", () => {
      const helper = createHelper(["en", "fr", "de"], "en");
      const matched = helper.matchLocalesForAcceptLanguageHeader("de;q=0.9, fr;q=0.8");
      expect(helper.validateLocale(matched)).toBeNull();
    });

    it("default locale fallback is always valid", () => {
      const helper = createHelper(["en", "fr"], "en");
      const matched = helper.matchLocales(["ja"]);
      expect(matched).toBe("en");
      expect(helper.validateLocale(matched)).toBeNull();
    });

    it("each method can be called multiple times on the same instance", () => {
      const helper = createHelper();

      expect(helper.matchLocales(["fr"])).toBe("fr");
      expect(helper.matchLocales(["de"])).toBe("de");
      expect(helper.matchLocalesForAcceptLanguageHeader("it")).toBe("it");
      expect(helper.validateLocale("es")).toBeNull();
      expect(helper.validateLocale("ja")).toBeInstanceOf(RMachineError);
    });
  });
});

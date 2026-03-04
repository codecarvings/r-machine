import { describe, expect, it } from "vitest";

import { RMachineError } from "#r-machine/errors";
import { LocaleHelper } from "../../src/lib/locale-helper.js";

const locales = ["en", "fr", "de", "it", "es"] as const;
const defaultLocale = "en";

function createHelper(locs: readonly string[] = locales, def: string = defaultLocale): LocaleHelper {
  return new LocaleHelper(locs, def);
}

describe("LocaleHelper", () => {
  describe("matchLocales", () => {
    it("returns the first matching locale", () => {
      const helper = createHelper();
      expect(helper.matchLocales(["fr", "de"])).toBe("fr");
    });

    it("returns the default locale when no match is found", () => {
      const helper = createHelper();
      expect(helper.matchLocales(["ja", "ko"])).toBe("en");
    });

    it("forwards the algorithm parameter", () => {
      const helper = createHelper();
      expect(helper.matchLocales(["fr"], "lookup")).toBe("fr");
      expect(helper.matchLocales(["fr"], "best-fit")).toBe("fr");
    });
  });

  describe("matchLocalesForAcceptLanguageHeader", () => {
    it("parses and matches an Accept-Language header", () => {
      const helper = createHelper();
      expect(helper.matchLocalesForAcceptLanguageHeader("de;q=0.7, fr;q=0.9")).toBe("fr");
    });

    it("returns the default locale for null, undefined or empty header", () => {
      const helper = createHelper();
      expect(helper.matchLocalesForAcceptLanguageHeader(null)).toBe("en");
      expect(helper.matchLocalesForAcceptLanguageHeader(undefined)).toBe("en");
      expect(helper.matchLocalesForAcceptLanguageHeader("")).toBe("en");
    });

    it("forwards the algorithm parameter", () => {
      const helper = createHelper();
      expect(helper.matchLocalesForAcceptLanguageHeader("fr", "lookup")).toBe("fr");
      expect(helper.matchLocalesForAcceptLanguageHeader("fr", "best-fit")).toBe("fr");
    });
  });

  describe("validateLocale", () => {
    it("returns null for a valid locale in the list", () => {
      const helper = createHelper();
      expect(helper.validateLocale("en")).toBeNull();
      expect(helper.validateLocale("fr")).toBeNull();
    });

    it("returns an RMachineError for a locale not in the list", () => {
      const helper = createHelper();
      const result = helper.validateLocale("ja");
      expect(result).toBeInstanceOf(RMachineError);
      expect(result!.message).toContain("ja");
    });

    it("is case-sensitive", () => {
      const helper = createHelper(["en"], "en");
      expect(helper.validateLocale("EN")).toBeInstanceOf(RMachineError);
    });

    it("handles locales with region subtags", () => {
      const helper = createHelper(["en-US", "en-GB"], "en-US");
      expect(helper.validateLocale("en-US")).toBeNull();
      expect(helper.validateLocale("en-GB")).toBeNull();
      expect(helper.validateLocale("en")).toBeInstanceOf(RMachineError);
    });
  });

  describe("integration", () => {
    it("matchLocales result is always valid according to validateLocale", () => {
      const helper = createHelper(["en", "fr", "de"], "en");
      expect(helper.validateLocale(helper.matchLocales(["fr"]))).toBeNull();
      expect(helper.validateLocale(helper.matchLocales(["ja"]))).toBeNull();
    });

    it("matchLocalesForAcceptLanguageHeader result is always valid", () => {
      const helper = createHelper(["en", "fr", "de"], "en");
      expect(helper.validateLocale(helper.matchLocalesForAcceptLanguageHeader("de;q=0.9"))).toBeNull();
    });
  });
});

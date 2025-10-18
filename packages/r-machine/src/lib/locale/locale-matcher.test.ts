import { describe, expect, it } from "vitest";
import { matchLocales } from "./locale-matcher.js";

describe("matchLocales", () => {
  describe("lookup algorithm", () => {
    it("should return exact match when available", () => {
      const result = matchLocales(["en-US"], ["en-US", "it-IT"], "en", { algorithm: "lookup" });
      expect(result).toBe("en-US");
    });

    it("should fallback to language when region not available", () => {
      const result = matchLocales(["en-GB"], ["en", "it"], "en", { algorithm: "lookup" });
      expect(result).toBe("en");
    });

    it("should return default when no match found", () => {
      const result = matchLocales(["zh-CN"], ["en", "it"], "en", { algorithm: "lookup" });
      expect(result).toBe("en");
    });

    it("should handle complex locale tags", () => {
      const result = matchLocales(["zh-Hans-CN"], ["zh-Hans", "en"], "en", { algorithm: "lookup" });
      expect(result).toBe("zh-Hans");
    });

    it("should process requested locales in order", () => {
      const result = matchLocales(["de-DE", "en-US"], ["en-US", "it-IT"], "it", { algorithm: "lookup" });
      expect(result).toBe("en-US");
    });
  });

  describe("best-fit algorithm", () => {
    it("should return exact match when available", () => {
      const result = matchLocales(["it-IT"], ["en-US", "it-IT"], "en", { algorithm: "best-fit" });
      expect(result).toBe("it-IT");
    });

    it("should match language even with different regions", () => {
      const result = matchLocales(["it-XX"], ["it-IT", "en-US"], "en", { algorithm: "best-fit" });
      expect(result).toBe("it-IT");
    });

    it("should fallback to language when region not available", () => {
      const result = matchLocales(["it-IT"], ["it", "en-US"], "en", { algorithm: "best-fit" });
      expect(result).toBe("it");
    });

    it("should return default when no language match", () => {
      const result = matchLocales(["zh-CN"], ["en-US", "it-IT"], "en", { algorithm: "best-fit" });
      expect(result).toBe("en");
    });

    it("should default to best-fit algorithm", () => {
      const result = matchLocales(["it-XX"], ["it-IT", "en-US"], "en");
      expect(result).toBe("it-IT");
    });
  });

  describe("edge cases", () => {
    it("should handle empty requested locales", () => {
      const result = matchLocales([], ["en-US", "it-IT"], "it");
      expect(result).toBe("it");
    });

    it("should handle empty available locales", () => {
      const result = matchLocales(["en-US"], [], "en");
      expect(result).toBe("en");
    });

    it("should handle empty string locale", () => {
      const result = matchLocales([""], ["en-US", "it-IT"], "en");
      expect(result).toBe("en");
    });

    it("should normalize underscore to hyphen", () => {
      const result = matchLocales(["en_US"], ["en-US"], "en");
      expect(result).toBe("en-US");
    });

    it("should handle case insensitive matching", () => {
      const result = matchLocales(["EN-us"], ["en-US"], "en");
      expect(result).toBe("en-US");
    });

    it("should handle invalid locale tags gracefully", () => {
      const result = matchLocales(["invalid-locale"], ["en-US"], "en");
      expect(result).toBe("en");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle Accept-Language header order", () => {
      const result = matchLocales(["it-IT", "en-US", "en"], ["en-US", "es-ES"], "en");
      expect(result).toBe("en-US");
    });

    it("should work with partial matches", () => {
      const result = matchLocales(["zh-Hans-CN"], ["zh", "en"], "en");
      expect(result).toBe("zh");
    });
  });

  describe("singleton subtag handling", () => {
    it("should strip singleton subtags in lookup algorithm", () => {
      const result = matchLocales(["en-US-x-private"], ["en-US", "en"], "en", { algorithm: "lookup" });
      expect(result).toBe("en-US");
    });

    it("should strip Unicode extension subtags", () => {
      const result = matchLocales(["en-u-ca-buddhist"], ["en", "it"], "it", { algorithm: "lookup" });
      expect(result).toBe("en");
    });

    it("should handle multiple singleton subtags", () => {
      const result = matchLocales(["zh-Hans-CN-x-foo"], ["zh-Hans-CN", "en"], "en", { algorithm: "lookup" });
      expect(result).toBe("zh-Hans-CN");
    });
  });

  describe("best-fit algorithm priority", () => {
    it("should return first matching available locale when multiple match language", () => {
      const result = matchLocales(["en-GB"], ["en-US", "en-AU", "en-GB"], "en", { algorithm: "best-fit" });
      expect(result).toBe("en-GB");
    });

    it("should prioritize exact match over language match", () => {
      const result = matchLocales(["en-GB", "it-IT"], ["it-CH", "en-GB"], "en", { algorithm: "best-fit" });
      expect(result).toBe("en-GB");
    });

    it("should prefer later exact match over earlier partial match", () => {
      const result = matchLocales(["it-XX", "en-US"], ["it-IT", "en-US"], "en", { algorithm: "best-fit" });
      expect(result).toBe("it-IT");
    });

    it("should return first available locale with matching language", () => {
      const result = matchLocales(["en-XX"], ["en-US", "en-GB", "en-AU"], "it", { algorithm: "best-fit" });
      expect(result).toBe("en-US");
    });
  });

  describe("lookup vs best-fit divergence", () => {
    it("lookup should fail when region differs, best-fit should match language", () => {
      const requested = ["en-GB"];
      const available = ["en-US", "it-IT"];

      const lookupResult = matchLocales(requested, available, "it", { algorithm: "lookup" });
      const bestFitResult = matchLocales(requested, available, "it", { algorithm: "best-fit" });

      expect(lookupResult).toBe("it");
      expect(bestFitResult).toBe("en-US");
    });

    it("both should return exact match when available", () => {
      const requested = ["it-IT"];
      const available = ["en-US", "it-IT"];

      const lookupResult = matchLocales(requested, available, "en", { algorithm: "lookup" });
      const bestFitResult = matchLocales(requested, available, "en", { algorithm: "best-fit" });

      expect(lookupResult).toBe("it-IT");
      expect(bestFitResult).toBe("it-IT");
    });
  });

  describe("script tags", () => {
    it("should differentiate between script variants in lookup", () => {
      const result = matchLocales(["zh-Hans"], ["zh-Hant", "en"], "en", { algorithm: "lookup" });
      expect(result).toBe("en");
    });

    it("should match base language in best-fit when script differs", () => {
      const result = matchLocales(["zh-Hans"], ["zh", "en"], "en", { algorithm: "best-fit" });
      expect(result).toBe("zh");
    });

    it("should handle script-region combinations", () => {
      const result = matchLocales(["zh-Hans-CN"], ["zh-Hans", "en"], "en", { algorithm: "lookup" });
      expect(result).toBe("zh-Hans");
    });
  });

  describe("default locale handling", () => {
    it("should canonicalize default locale with underscore", () => {
      const result = matchLocales(["it-IT"], ["en-US"], "en_GB");
      expect(result).toBe("en-GB");
    });

    it("should normalize case in default locale via Intl.Locale", () => {
      const result = matchLocales(["it-IT"], ["en-US"], "EN-us");
      expect(result).toBe("en-US");
    });

    it("should handle invalid default locale", () => {
      const result = matchLocales(["it-IT"], ["en-US"], "invalid_locale");
      expect(result).toBe("invalid-locale");
    });
  });

  describe("case sensitivity", () => {
    it("should match available locales regardless of case", () => {
      const result = matchLocales(["en-us"], ["EN-US", "it-IT"], "it");
      expect(result).toBe("en-US");
    });

    it("should handle mixed case in available locales", () => {
      const result = matchLocales(["IT-it"], ["En-Us", "It-It"], "en");
      expect(result).toBe("it-IT");
    });

    it("should normalize both requested and available locales", () => {
      const result = matchLocales(["EN-gb"], ["en-GB"], "it");
      expect(result).toBe("en-GB");
    });
  });

  describe("malformed input", () => {
    it("should handle locales with multiple consecutive hyphens via Intl.Locale", () => {
      const result = matchLocales(["en--US"], ["en-US"], "en");
      expect(result).toBe("en-US");
    });

    it("should handle trailing hyphens via Intl.Locale", () => {
      const result = matchLocales(["en-US-"], ["en-US"], "en");
      expect(result).toBe("en-US");
    });

    it("should handle leading hyphens gracefully", () => {
      const result = matchLocales(["-en-US"], ["en-US"], "en");
      expect(result).toBe("en");
    });
  });

  describe("canonicalization caching", () => {
    it("should handle repeated locale lookups efficiently", () => {
      const locale = "en-US";
      const result1 = matchLocales([locale], ["en-US"], "en");
      const result2 = matchLocales([locale], ["en-US"], "en");
      const result3 = matchLocales([locale], ["en-US"], "en");

      expect(result1).toBe("en-US");
      expect(result2).toBe("en-US");
      expect(result3).toBe("en-US");
    });

    it("should cache different case variations separately", () => {
      const result1 = matchLocales(["en-US"], ["en-US"], "en");
      const result2 = matchLocales(["EN-us"], ["en-US"], "en");

      expect(result1).toBe("en-US");
      expect(result2).toBe("en-US");
    });
  });

  describe("complex priority scenarios", () => {
    it("should process multiple requested locales with mixed exact and partial matches", () => {
      const result = matchLocales(["fr-CA", "en-GB", "it-IT"], ["en-US", "it-IT", "de-DE"], "de", {
        algorithm: "best-fit",
      });
      expect(result).toBe("en-US");
    });

    it("should handle requested locales with varying specificity", () => {
      const result = matchLocales(["zh-Hans-CN-x-private", "en"], ["en-US", "zh", "it"], "it", {
        algorithm: "lookup",
      });
      expect(result).toBe("zh");
    });
  });

  describe("wildcard matching (RFC 4647)", () => {
    describe("universal wildcard '*'", () => {
      it("should skip '*' and continue to next range in lookup", () => {
        const result = matchLocales(["*", "en-US"], ["en-US", "it-IT"], "it", { algorithm: "lookup" });
        expect(result).toBe("en-US");
      });

      it("should skip '*' and continue to next range in best-fit", () => {
        const result = matchLocales(["*", "it-IT"], ["en-US", "it-IT"], "en", { algorithm: "best-fit" });
        expect(result).toBe("it-IT");
      });

      it("should return default when only '*' is provided", () => {
        const result = matchLocales(["*"], ["en-US", "it-IT"], "de", { algorithm: "lookup" });
        expect(result).toBe("de");
      });

      it("should return default when '*' is last and no previous match", () => {
        const result = matchLocales(["zh-CN", "*"], ["en-US", "it-IT"], "en", { algorithm: "best-fit" });
        expect(result).toBe("en");
      });
    });

    describe("extended wildcard ranges", () => {
      it("should match 'en-*' to any English locale in lookup", () => {
        const result = matchLocales(["en-*"], ["en-US", "it-IT", "en-GB"], "it", { algorithm: "lookup" });
        expect(result).toBe("en-US");
      });

      it("should match 'en-*' to any English locale in best-fit", () => {
        const result = matchLocales(["en-*"], ["it-IT", "en-GB", "de-DE"], "it", { algorithm: "best-fit" });
        expect(result).toBe("en-GB");
      });

      it("should match 'zh-Hans-*' to Chinese simplified locales", () => {
        const result = matchLocales(["zh-Hans-*"], ["zh-Hant-TW", "zh-Hans-CN", "en-US"], "en", {
          algorithm: "lookup",
        });
        expect(result).toBe("zh-Hans-CN");
      });

      it("should not match wildcard when prefix differs", () => {
        const result = matchLocales(["en-*"], ["it-IT", "de-DE"], "it", { algorithm: "lookup" });
        expect(result).toBe("it");
      });

      it("should prioritize wildcard match over language-only fallback", () => {
        const result = matchLocales(["en-*", "it"], ["it-IT", "en-GB"], "de", { algorithm: "lookup" });
        expect(result).toBe("en-GB");
      });

      it("should match exact locale before wildcard in same range", () => {
        const result = matchLocales(["en-US", "en-*"], ["en-GB", "it-IT"], "it", { algorithm: "lookup" });
        expect(result).toBe("en-GB");
      });
    });

    describe("wildcard position handling", () => {
      it("should match '*-US' to first available locale (wildcard in first position)", () => {
        const result = matchLocales(["*-US"], ["it-IT", "en-US", "de-DE"], "it", { algorithm: "lookup" });
        expect(result).toBe("it-IT");
      });

      it("should ignore wildcard in non-first positions per RFC 4647", () => {
        const result = matchLocales(["en-*-foo"], ["en-US", "it-IT"], "it", { algorithm: "lookup" });
        expect(result).toBe("it");
      });
    });

    describe("wildcard with priority order", () => {
      it("should process wildcards in order with other ranges", () => {
        const result = matchLocales(["it-*", "en-*", "de"], ["en-US", "de-DE"], "fr", { algorithm: "lookup" });
        expect(result).toBe("en-US");
      });

      it("should return first match when multiple wildcards match", () => {
        const result = matchLocales(["en-*", "en-GB"], ["en-US", "en-GB", "en-AU"], "it", { algorithm: "lookup" });
        expect(result).toBe("en-US");
      });
    });

    describe("edge cases with wildcards", () => {
      it("should handle empty locale list with wildcard", () => {
        const result = matchLocales(["en-*"], [], "en", { algorithm: "lookup" });
        expect(result).toBe("en");
      });

      it("should handle wildcard with case normalization", () => {
        const result = matchLocales(["EN-*"], ["en-US", "it-IT"], "it", { algorithm: "lookup" });
        expect(result).toBe("en-US");
      });

      it("should match wildcard after canonicalization", () => {
        const result = matchLocales(["en_*"], ["en-US", "it-IT"], "it", { algorithm: "lookup" });
        expect(result).toBe("en-US");
      });
    });
  });
});

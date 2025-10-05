import { describe, expect, it } from "vitest";
import type { AcceptLanguageEntry } from "../../locale/parse-accept-language.js";
import { fullParseAcceptLanguage, parseAcceptLanguage } from "../../locale/parse-accept-language.js";

describe("fullParseAcceptLanguage", () => {
  describe("basic parsing", () => {
    it("should parse single language without quality", () => {
      const result = fullParseAcceptLanguage("en");
      expect(result).toEqual([{ range: "en", quality: 1.0 }]);
    });

    it("should parse single language with region", () => {
      const result = fullParseAcceptLanguage("en-US");
      expect(result).toEqual([{ range: "en-US", quality: 1.0 }]);
    });

    it("should parse wildcard", () => {
      const result = fullParseAcceptLanguage("*");
      expect(result).toEqual([{ range: "*", quality: 1.0 }]);
    });

    it("should parse multiple languages without quality", () => {
      const result = fullParseAcceptLanguage("en, fr, de");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
        { range: "de", quality: 1.0 },
      ]);
    });

    it("should parse language with quality value", () => {
      const result = fullParseAcceptLanguage("en;q=0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should parse multiple languages with quality values", () => {
      const result = fullParseAcceptLanguage("en;q=0.8, fr;q=0.9");
      expect(result).toEqual([
        { range: "fr", quality: 0.9 },
        { range: "en", quality: 0.8 },
      ]);
    });
  });

  describe("quality value handling", () => {
    it("should default quality to 1.0 when not specified", () => {
      const result = fullParseAcceptLanguage("en-US");
      expect(result[0].quality).toBe(1.0);
    });

    it("should parse quality with three decimal places", () => {
      const result = fullParseAcceptLanguage("en;q=0.123");
      expect(result).toEqual([{ range: "en", quality: 0.123 }]);
    });

    it("should parse quality with two decimal places", () => {
      const result = fullParseAcceptLanguage("en;q=0.12");
      expect(result).toEqual([{ range: "en", quality: 0.12 }]);
    });

    it("should parse quality with one decimal place", () => {
      const result = fullParseAcceptLanguage("en;q=0.1");
      expect(result).toEqual([{ range: "en", quality: 0.1 }]);
    });

    it("should parse quality with no decimal places", () => {
      const result = fullParseAcceptLanguage("en;q=1");
      expect(result).toEqual([{ range: "en", quality: 1.0 }]);
    });

    it("should parse quality of 0", () => {
      const result = fullParseAcceptLanguage("en;q=0");
      expect(result).toEqual([]);
    });

    it("should parse quality with leading zero", () => {
      const result = fullParseAcceptLanguage("en;q=0.5");
      expect(result).toEqual([{ range: "en", quality: 0.5 }]);
    });

    it("should handle q=1.0", () => {
      const result = fullParseAcceptLanguage("en;q=1.0");
      expect(result).toEqual([{ range: "en", quality: 1.0 }]);
    });

    it("should handle q=1.00", () => {
      const result = fullParseAcceptLanguage("en;q=1.00");
      expect(result).toEqual([{ range: "en", quality: 1.0 }]);
    });

    it("should handle q=1.000", () => {
      const result = fullParseAcceptLanguage("en;q=1.000");
      expect(result).toEqual([{ range: "en", quality: 1.0 }]);
    });

    it("should reject quality greater than 1", () => {
      const result = fullParseAcceptLanguage("en;q=1.5");
      expect(result).toEqual([]);
    });

    it("should reject quality of 2", () => {
      const result = fullParseAcceptLanguage("en;q=2");
      expect(result).toEqual([]);
    });

    it("should reject negative quality", () => {
      const result = fullParseAcceptLanguage("en;q=-0.5");
      expect(result).toEqual([]);
    });

    it("should filter out zero quality entries", () => {
      const result = fullParseAcceptLanguage("en;q=0, fr;q=0.8");
      expect(result).toEqual([{ range: "fr", quality: 0.8 }]);
    });
  });

  describe("sorting behavior", () => {
    it("should sort by quality descending", () => {
      const result = fullParseAcceptLanguage("en;q=0.5, fr;q=0.9, de;q=0.7");
      expect(result).toEqual([
        { range: "fr", quality: 0.9 },
        { range: "de", quality: 0.7 },
        { range: "en", quality: 0.5 },
      ]);
    });

    it("should preserve order when quality is equal", () => {
      const result = fullParseAcceptLanguage("en, fr, de");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
        { range: "de", quality: 1.0 },
      ]);
    });

    it("should place explicit q=1.0 before implicit q=1.0 with same position", () => {
      const result = fullParseAcceptLanguage("en;q=1.0, fr");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
      ]);
    });

    it("should sort mixed quality values correctly", () => {
      const result = fullParseAcceptLanguage("en-US, en;q=0.9, fr;q=0.8, *;q=0.1");
      expect(result).toEqual([
        { range: "en-US", quality: 1.0 },
        { range: "en", quality: 0.9 },
        { range: "fr", quality: 0.8 },
        { range: "*", quality: 0.1 },
      ]);
    });
  });

  describe("whitespace handling", () => {
    it("should handle spaces around commas", () => {
      const result = fullParseAcceptLanguage("en , fr , de");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
        { range: "de", quality: 1.0 },
      ]);
    });

    it("should handle spaces around semicolons", () => {
      const result = fullParseAcceptLanguage("en ; q=0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should handle spaces around equals sign", () => {
      const result = fullParseAcceptLanguage("en;q = 0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should handle multiple consecutive spaces", () => {
      const result = fullParseAcceptLanguage("en  ,  fr");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
      ]);
    });

    it("should handle leading whitespace", () => {
      const result = fullParseAcceptLanguage("  en, fr");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
      ]);
    });

    it("should handle trailing whitespace", () => {
      const result = fullParseAcceptLanguage("en, fr  ");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
      ]);
    });

    it("should handle tabs and other whitespace", () => {
      const result = fullParseAcceptLanguage("en\t,\tfr");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
      ]);
    });
  });

  describe("case sensitivity", () => {
    it("should preserve case in language range", () => {
      const result = fullParseAcceptLanguage("EN-us");
      expect(result[0].range).toBe("EN-us");
    });

    it("should handle uppercase Q parameter", () => {
      const result = fullParseAcceptLanguage("en;Q=0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should handle mixed case Q parameter", () => {
      const result = fullParseAcceptLanguage("en;q=0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });
  });

  describe("complex language ranges", () => {
    it("should parse language with script", () => {
      const result = fullParseAcceptLanguage("zh-Hans");
      expect(result).toEqual([{ range: "zh-Hans", quality: 1.0 }]);
    });

    it("should parse language with script and region", () => {
      const result = fullParseAcceptLanguage("zh-Hans-CN");
      expect(result).toEqual([{ range: "zh-Hans-CN", quality: 1.0 }]);
    });

    it("should parse extended language ranges with wildcards", () => {
      const result = fullParseAcceptLanguage("en-*");
      expect(result).toEqual([{ range: "en-*", quality: 1.0 }]);
    });

    it("should parse language with multiple subtags", () => {
      const result = fullParseAcceptLanguage("zh-cmn-Hans-CN");
      expect(result).toEqual([{ range: "zh-cmn-Hans-CN", quality: 1.0 }]);
    });

    it("should parse language with numeric region code", () => {
      const result = fullParseAcceptLanguage("es-419");
      expect(result).toEqual([{ range: "es-419", quality: 1.0 }]);
    });

    it("should parse language with variant", () => {
      const result = fullParseAcceptLanguage("de-DE-1996");
      expect(result).toEqual([{ range: "de-DE-1996", quality: 1.0 }]);
    });

    it("should parse extended language subtag", () => {
      const result = fullParseAcceptLanguage("zh-yue-HK");
      expect(result).toEqual([{ range: "zh-yue-HK", quality: 1.0 }]);
    });
  });

  describe("invalid input handling", () => {
    it("should return empty array for empty string", () => {
      const result = fullParseAcceptLanguage("");
      expect(result).toEqual([]);
    });

    it("should return empty array for whitespace only", () => {
      const result = fullParseAcceptLanguage("   ");
      expect(result).toEqual([]);
    });

    it("should return empty array for null input", () => {
      const result = fullParseAcceptLanguage(null as unknown as string);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = fullParseAcceptLanguage(undefined as unknown as string);
      expect(result).toEqual([]);
    });

    it("should return empty array for non-string input", () => {
      const result = fullParseAcceptLanguage(123 as unknown as string);
      expect(result).toEqual([]);
    });

    it("should skip invalid language range with numbers in first part", () => {
      const result = fullParseAcceptLanguage("en1, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip language range with invalid characters", () => {
      const result = fullParseAcceptLanguage("en@US, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip language range exceeding 8 characters in primary subtag", () => {
      const result = fullParseAcceptLanguage("verylongname, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip language range exceeding 8 characters in subtag", () => {
      const result = fullParseAcceptLanguage("en-verylongsubtag, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip empty language range", () => {
      const result = fullParseAcceptLanguage(", fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip language range with consecutive hyphens", () => {
      const result = fullParseAcceptLanguage("en--US, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip language range starting with hyphen", () => {
      const result = fullParseAcceptLanguage("-en, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip language range ending with hyphen", () => {
      const result = fullParseAcceptLanguage("en-, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip invalid quality value with more than 3 decimal places", () => {
      const result = fullParseAcceptLanguage("en;q=0.1234, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip entry with malformed q parameter", () => {
      const result = fullParseAcceptLanguage("en;q=abc, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should skip entry with missing q value", () => {
      const result = fullParseAcceptLanguage("en;q=, fr");
      expect(result).toEqual([{ range: "fr", quality: 1.0 }]);
    });

    it("should handle multiple commas", () => {
      const result = fullParseAcceptLanguage("en,, fr");
      expect(result).toEqual([
        { range: "en", quality: 1.0 },
        { range: "fr", quality: 1.0 },
      ]);
    });
  });

  describe("real-world examples", () => {
    it("should parse Chrome-like header", () => {
      const result = fullParseAcceptLanguage("en-US,en;q=0.9,es;q=0.8");
      expect(result).toEqual([
        { range: "en-US", quality: 1.0 },
        { range: "en", quality: 0.9 },
        { range: "es", quality: 0.8 },
      ]);
    });

    it("should parse Firefox-like header", () => {
      const result = fullParseAcceptLanguage("en-US,en;q=0.5");
      expect(result).toEqual([
        { range: "en-US", quality: 1.0 },
        { range: "en", quality: 0.5 },
      ]);
    });

    it("should parse complex multilingual header", () => {
      const result = fullParseAcceptLanguage("fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5");
      expect(result).toEqual([
        { range: "fr-CH", quality: 1.0 },
        { range: "fr", quality: 0.9 },
        { range: "en", quality: 0.8 },
        { range: "de", quality: 0.7 },
        { range: "*", quality: 0.5 },
      ]);
    });

    it("should parse Danish example from RFC", () => {
      const result = fullParseAcceptLanguage("da, en-GB;q=0.8, en;q=0.7");
      expect(result).toEqual([
        { range: "da", quality: 1.0 },
        { range: "en-GB", quality: 0.8 },
        { range: "en", quality: 0.7 },
      ]);
    });

    it("should parse Chinese variants", () => {
      const result = fullParseAcceptLanguage("zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7");
      expect(result).toEqual([
        { range: "zh-CN", quality: 1.0 },
        { range: "zh", quality: 0.9 },
        { range: "zh-TW", quality: 0.8 },
        { range: "en", quality: 0.7 },
      ]);
    });

    it("should handle header with wildcard fallback", () => {
      const result = fullParseAcceptLanguage("en-US, *;q=0.1");
      expect(result).toEqual([
        { range: "en-US", quality: 1.0 },
        { range: "*", quality: 0.1 },
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle single wildcard", () => {
      const result = fullParseAcceptLanguage("*");
      expect(result).toEqual([{ range: "*", quality: 1.0 }]);
    });

    it("should handle wildcard with quality", () => {
      const result = fullParseAcceptLanguage("*;q=0.1");
      expect(result).toEqual([{ range: "*", quality: 0.1 }]);
    });

    it("should handle only commas", () => {
      const result = fullParseAcceptLanguage(",,,");
      expect(result).toEqual([]);
    });

    it("should handle quality of 0.0", () => {
      const result = fullParseAcceptLanguage("en;q=0.0");
      expect(result).toEqual([]);
    });

    it("should handle quality of 0.000", () => {
      const result = fullParseAcceptLanguage("en;q=0.000");
      expect(result).toEqual([]);
    });

    it("should handle very small quality value", () => {
      const result = fullParseAcceptLanguage("en;q=0.001");
      expect(result).toEqual([{ range: "en", quality: 0.001 }]);
    });

    it("should handle two-letter language code", () => {
      const result = fullParseAcceptLanguage("en");
      expect(result).toEqual([{ range: "en", quality: 1.0 }]);
    });

    it("should handle three-letter language code", () => {
      const result = fullParseAcceptLanguage("eng");
      expect(result).toEqual([{ range: "eng", quality: 1.0 }]);
    });

    it("should handle maximum-length primary language tag (8 chars)", () => {
      const result = fullParseAcceptLanguage("language");
      expect(result).toEqual([{ range: "language", quality: 1.0 }]);
    });

    it("should handle maximum-length subtag (8 chars)", () => {
      const result = fullParseAcceptLanguage("en-12345678");
      expect(result).toEqual([{ range: "en-12345678", quality: 1.0 }]);
    });

    it("should handle single character subtag", () => {
      const result = fullParseAcceptLanguage("en-a");
      expect(result).toEqual([{ range: "en-a", quality: 1.0 }]);
    });

    it("should preserve multiple entries with same quality in order", () => {
      const result = fullParseAcceptLanguage("en;q=0.8, fr;q=0.8, de;q=0.8");
      expect(result).toEqual([
        { range: "en", quality: 0.8 },
        { range: "fr", quality: 0.8 },
        { range: "de", quality: 0.8 },
      ]);
    });
  });

  describe("additional parameters (ignored)", () => {
    it("should ignore non-q parameters", () => {
      const result = fullParseAcceptLanguage("en;level=1;q=0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should use first q parameter when multiple present", () => {
      const result = fullParseAcceptLanguage("en;q=0.8;q=0.5");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should handle parameters before q", () => {
      const result = fullParseAcceptLanguage("en;level=1;q=0.8");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });

    it("should handle parameters after q", () => {
      const result = fullParseAcceptLanguage("en;q=0.8;level=1");
      expect(result).toEqual([{ range: "en", quality: 0.8 }]);
    });
  });

  describe("type safety", () => {
    it("should return correct type structure", () => {
      const result: AcceptLanguageEntry[] = fullParseAcceptLanguage("en");
      expect(result[0]).toHaveProperty("range");
      expect(result[0]).toHaveProperty("quality");
      expect(typeof result[0].range).toBe("string");
      expect(typeof result[0].quality).toBe("number");
    });
  });
});

describe("parseAcceptLanguage", () => {
  describe("basic parsing", () => {
    it("should return array of language ranges without quality values", () => {
      const result = parseAcceptLanguage("en");
      expect(result).toEqual(["en"]);
    });

    it("should return sorted language ranges", () => {
      const result = parseAcceptLanguage("en-US,en;q=0.9,fr;q=0.8");
      expect(result).toEqual(["en-US", "en", "fr"]);
    });

    it("should handle multiple languages with same quality in order", () => {
      const result = parseAcceptLanguage("en, fr, de");
      expect(result).toEqual(["en", "fr", "de"]);
    });

    it("should return empty array for empty string", () => {
      const result = parseAcceptLanguage("");
      expect(result).toEqual([]);
    });

    it("should return empty array for whitespace only", () => {
      const result = parseAcceptLanguage("   ");
      expect(result).toEqual([]);
    });
  });

  describe("quality-based sorting", () => {
    it("should sort by quality descending", () => {
      const result = parseAcceptLanguage("en;q=0.5, fr;q=0.9, de;q=0.7");
      expect(result).toEqual(["fr", "de", "en"]);
    });

    it("should place higher quality first", () => {
      const result = parseAcceptLanguage("fr;q=0.8, en-US");
      expect(result).toEqual(["en-US", "fr"]);
    });

    it("should filter out zero quality entries", () => {
      const result = parseAcceptLanguage("en;q=0, fr;q=0.8, de");
      expect(result).toEqual(["de", "fr"]);
    });

    it("should preserve order when quality is equal", () => {
      const result = parseAcceptLanguage("en;q=0.8, fr;q=0.8, de;q=0.8");
      expect(result).toEqual(["en", "fr", "de"]);
    });
  });

  describe("real-world examples", () => {
    it("should parse Chrome-like header", () => {
      const result = parseAcceptLanguage("en-US,en;q=0.9,es;q=0.8");
      expect(result).toEqual(["en-US", "en", "es"]);
    });

    it("should parse Firefox-like header", () => {
      const result = parseAcceptLanguage("en-US,en;q=0.5");
      expect(result).toEqual(["en-US", "en"]);
    });

    it("should parse Danish example from RFC", () => {
      const result = parseAcceptLanguage("da, en-GB;q=0.8, en;q=0.7");
      expect(result).toEqual(["da", "en-GB", "en"]);
    });

    it("should parse complex multilingual header", () => {
      const result = parseAcceptLanguage("fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5");
      expect(result).toEqual(["fr-CH", "fr", "en", "de", "*"]);
    });

    it("should parse Chinese variants", () => {
      const result = parseAcceptLanguage("zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7");
      expect(result).toEqual(["zh-CN", "zh", "zh-TW", "en"]);
    });

    it("should handle header with wildcard fallback", () => {
      const result = parseAcceptLanguage("en-US, *;q=0.1");
      expect(result).toEqual(["en-US", "*"]);
    });
  });

  describe("edge cases", () => {
    it("should handle single wildcard", () => {
      const result = parseAcceptLanguage("*");
      expect(result).toEqual(["*"]);
    });

    it("should handle wildcard with quality", () => {
      const result = parseAcceptLanguage("*;q=0.1");
      expect(result).toEqual(["*"]);
    });

    it("should handle null input", () => {
      const result = parseAcceptLanguage(null as unknown as string);
      expect(result).toEqual([]);
    });

    it("should handle undefined input", () => {
      const result = parseAcceptLanguage(undefined as unknown as string);
      expect(result).toEqual([]);
    });

    it("should preserve case in language ranges", () => {
      const result = parseAcceptLanguage("EN-us, FR-ca;q=0.8");
      expect(result).toEqual(["EN-us", "FR-ca"]);
    });
  });

  describe("invalid input handling", () => {
    it("should skip invalid language ranges", () => {
      const result = parseAcceptLanguage("en1, fr, de@AT");
      expect(result).toEqual(["fr"]);
    });

    it("should skip entries with invalid quality", () => {
      const result = parseAcceptLanguage("en;q=1.5, fr;q=0.8");
      expect(result).toEqual(["fr"]);
    });

    it("should skip entries with malformed quality", () => {
      const result = parseAcceptLanguage("en;q=abc, fr");
      expect(result).toEqual(["fr"]);
    });

    it("should handle only commas", () => {
      const result = parseAcceptLanguage(",,,");
      expect(result).toEqual([]);
    });
  });

  describe("whitespace handling", () => {
    it("should handle spaces around commas", () => {
      const result = parseAcceptLanguage("en , fr , de");
      expect(result).toEqual(["en", "fr", "de"]);
    });

    it("should handle leading and trailing whitespace", () => {
      const result = parseAcceptLanguage("  en-US, fr;q=0.8  ");
      expect(result).toEqual(["en-US", "fr"]);
    });
  });

  describe("type safety", () => {
    it("should return array of strings", () => {
      const result: string[] = parseAcceptLanguage("en,fr");
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result[0]).toBe("string");
      expect(typeof result[1]).toBe("string");
    });
  });
});

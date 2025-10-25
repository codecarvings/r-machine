import { RMachineError } from "r-machine/common";
import { describe, expect, it } from "vitest";
import { getCanonicalUnicodeLocaleId, validateCanonicalUnicodeLocaleId } from "./canonical-unicode-locale-id.js";

describe("getCanonicalUnicodeLocaleId", () => {
  describe("valid locale canonicalization", () => {
    it("should canonicalize en-US to en-US", () => {
      const result = getCanonicalUnicodeLocaleId("en-US");
      expect(result).toBe("en-US");
    });

    it("should canonicalize en-us to en-US", () => {
      const result = getCanonicalUnicodeLocaleId("en-us");
      expect(result).toBe("en-US");
    });

    it("should canonicalize EN-us to en-US", () => {
      const result = getCanonicalUnicodeLocaleId("EN-us");
      expect(result).toBe("en-US");
    });

    it("should canonicalize en_US to en-US", () => {
      const result = getCanonicalUnicodeLocaleId("en_US");
      expect(result).toBe("en-US");
    });

    it("should canonicalize EN_us to en-US", () => {
      const result = getCanonicalUnicodeLocaleId("EN_us");
      expect(result).toBe("en-US");
    });

    it("should canonicalize simple language tag", () => {
      const result = getCanonicalUnicodeLocaleId("en");
      expect(result).toBe("en");
    });

    it("should canonicalize language tag with script", () => {
      const result = getCanonicalUnicodeLocaleId("zh-Hans");
      expect(result).toBe("zh-Hans");
    });

    it("should canonicalize language-script-region tag", () => {
      const result = getCanonicalUnicodeLocaleId("zh-Hans-CN");
      expect(result).toBe("zh-Hans-CN");
    });

    it("should canonicalize locale with Unicode extension", () => {
      const result = getCanonicalUnicodeLocaleId("en-u-ca-buddhist");
      expect(result).toBe("en-u-ca-buddhist");
    });

    it("should canonicalize locale with private use extension", () => {
      const result = getCanonicalUnicodeLocaleId("en-US-x-private");
      expect(result).toBe("en-US-x-private");
    });
  });

  describe("invalid locale fallback", () => {
    it("should lowercase and replace underscores for invalid locale", () => {
      const result = getCanonicalUnicodeLocaleId("INVALID_LOCALE");
      expect(result).toBe("invalid-locale");
    });

    it("should handle locale with leading hyphen", () => {
      const result = getCanonicalUnicodeLocaleId("-en-US");
      expect(result).toBe("-en-us");
    });

    it("should handle locale with trailing hyphen", () => {
      const result = getCanonicalUnicodeLocaleId("en-US-");
      expect(result).toBe("en-US-");
    });

    it("should handle locale with consecutive hyphens", () => {
      const result = getCanonicalUnicodeLocaleId("en--US");
      expect(result).toBe("en-US");
    });

    it("should handle empty string and return 'und'", () => {
      const result = getCanonicalUnicodeLocaleId("");
      expect(result).toBe("und");
    });

    it("should handle locale with special characters", () => {
      const result = getCanonicalUnicodeLocaleId("en@posix");
      expect(result).toBe("en@posix");
    });
  });

  describe("edge cases", () => {
    it("should handle locale with only underscores", () => {
      const result = getCanonicalUnicodeLocaleId("___");
      expect(result).toBe("---");
    });

    it("should handle mixed underscores and hyphens", () => {
      const result = getCanonicalUnicodeLocaleId("en_US-x_private");
      expect(result).toBe("en-US-x-private");
    });

    it("should handle uppercase language code", () => {
      const result = getCanonicalUnicodeLocaleId("EN");
      expect(result).toBe("en");
    });

    it("should handle lowercase region code", () => {
      const result = getCanonicalUnicodeLocaleId("en-us");
      expect(result).toBe("en-US");
    });
  });
});

describe("validateCanonicalUnicodeLocaleId", () => {
  describe("valid canonical locales", () => {
    it("should return null for canonical en-US", () => {
      const result = validateCanonicalUnicodeLocaleId("en-US");
      expect(result).toBeNull();
    });

    it("should return null for canonical en", () => {
      const result = validateCanonicalUnicodeLocaleId("en");
      expect(result).toBeNull();
    });

    it("should return null for canonical zh-Hans", () => {
      const result = validateCanonicalUnicodeLocaleId("zh-Hans");
      expect(result).toBeNull();
    });

    it("should return null for canonical zh-Hans-CN", () => {
      const result = validateCanonicalUnicodeLocaleId("zh-Hans-CN");
      expect(result).toBeNull();
    });

    it("should return null for locale with Unicode extension", () => {
      const result = validateCanonicalUnicodeLocaleId("en-u-ca-buddhist");
      expect(result).toBeNull();
    });

    it("should return null for locale with private use extension", () => {
      const result = validateCanonicalUnicodeLocaleId("en-US-x-private");
      expect(result).toBeNull();
    });
  });

  describe("invalid non-canonical locales", () => {
    it("should return error for lowercase en-us", () => {
      const error = validateCanonicalUnicodeLocaleId("en-us");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "en-us"');
      expect(error?.message).toContain('Did you mean: "en-US"');
    });

    it("should return error for uppercase EN-US", () => {
      const error = validateCanonicalUnicodeLocaleId("EN-US");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "EN-US"');
      expect(error?.message).toContain('Did you mean: "en-US"');
    });

    it("should return error for underscore-separated en_US", () => {
      const error = validateCanonicalUnicodeLocaleId("en_US");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "en_US"');
      expect(error?.message).toContain('Did you mean: "en-US"');
    });

    it("should return error for uppercase EN", () => {
      const error = validateCanonicalUnicodeLocaleId("EN");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "EN"');
      expect(error?.message).toContain('Did you mean: "en"');
    });

    it("should return null for locale with trailing hyphen that canonicalizes to itself", () => {
      const error = validateCanonicalUnicodeLocaleId("en-US-");
      expect(error).toBeNull();
    });

    it("should return error for locale with leading hyphen", () => {
      const error = validateCanonicalUnicodeLocaleId("-en-US");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "-en-US"');
      expect(error?.message).toContain('Did you mean: "-en-us"');
    });

    it("should return error for completely invalid locale", () => {
      const error = validateCanonicalUnicodeLocaleId("INVALID_LOCALE");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "INVALID_LOCALE"');
      expect(error?.message).toContain('Did you mean: "invalid-locale"');
    });
  });

  describe("edge cases", () => {
    it("should return null for canonical und (undefined)", () => {
      const error = validateCanonicalUnicodeLocaleId("und");
      expect(error).toBeNull();
    });

    it("should return error for empty string", () => {
      const error = validateCanonicalUnicodeLocaleId("");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: ""');
      expect(error?.message).toContain('Did you mean: "und"');
    });

    it("should return error for consecutive hyphens", () => {
      const error = validateCanonicalUnicodeLocaleId("en--US");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "en--US"');
      expect(error?.message).toContain('Did you mean: "en-US"');
    });

    it("should return error for mixed underscores and hyphens", () => {
      const error = validateCanonicalUnicodeLocaleId("en_US-x_private");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "en_US-x_private"');
      expect(error?.message).toContain('Did you mean: "en-US-x-private"');
    });
  });

  describe("wildcards", () => {
    it("should return error for wildcard only", () => {
      const error = validateCanonicalUnicodeLocaleId("*");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "*"');
      expect(error?.message).toContain("Wildcards are not allowed");
    });

    it("should return error for wildcard in language position", () => {
      const error = validateCanonicalUnicodeLocaleId("*-US");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "*-US"');
      expect(error?.message).toContain("Wildcards are not allowed");
    });

    it("should return error for wildcard in region position", () => {
      const error = validateCanonicalUnicodeLocaleId("en-*");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "en-*"');
      expect(error?.message).toContain("Wildcards are not allowed");
    });

    it("should return error for wildcard in script position", () => {
      const error = validateCanonicalUnicodeLocaleId("zh-*-CN");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "zh-*-CN"');
      expect(error?.message).toContain("Wildcards are not allowed");
    });

    it("should return error for multiple wildcards", () => {
      const error = validateCanonicalUnicodeLocaleId("*-*");
      expect(error).toBeInstanceOf(RMachineError);
      expect(error?.message).toContain('Invalid locale identifier: "*-*"');
      expect(error?.message).toContain("Wildcards are not allowed");
    });
  });
});

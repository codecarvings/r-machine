import { describe, expect, test } from "vitest";
import { RMachineError } from "#r-machine/errors";
import { cloneRMachineConfig, type RMachineConfig, validateRMachineConfig } from "../../../src/lib/r-machine-config.js";

const stubResolver: RMachineConfig["rModuleResolver"] = async (namespace, locale) => {
  return { default: { message: `${namespace} in ${locale}` } };
};

function makeConfig(overrides: Partial<RMachineConfig> = {}): RMachineConfig {
  return {
    locales: ["en", "it"],
    defaultLocale: "en",
    rModuleResolver: stubResolver,
    ...overrides,
  };
}

describe("validateRMachineConfig", () => {
  test("should return null for a valid config with multiple locales", () => {
    const error = validateRMachineConfig(makeConfig());
    expect(error).toBeNull();
  });

  test("should return null for a valid config with a single locale", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en"], defaultLocale: "en" }));
    expect(error).toBeNull();
  });

  test("should return null for valid canonical locale IDs with region subtags", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "en-US", "it", "de-DE"], defaultLocale: "en" }));
    expect(error).toBeNull();
  });

  test("should return a RMachineError if no locales are provided", () => {
    const error = validateRMachineConfig(makeConfig({ locales: [], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("No locales provided");
  });

  test("should return a RMachineError if locales contains duplicates", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "it", "en"], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Duplicate locales provided");
  });

  test("should return a RMachineError if all locales are duplicates", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "en"], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Duplicate locales provided");
  });

  test("should return a RMachineError if default locale is not in the list of locales", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["it"], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Default locale "en" is not in the list of locales');
  });

  test("should return a RMachineError if a locale in the list is not canonical", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en_US"], defaultLocale: "en_US" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en_US"');
    expect(error?.message).toContain('Did you mean: "en-US"?');
  });

  test("should return a RMachineError if default locale is not canonical even when not in locales", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "it"], defaultLocale: "en_US" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en_US"');
    expect(error?.message).toContain('Did you mean: "en-US"?');
  });

  test("should return a RMachineError for a wildcard locale", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "*"], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Wildcards are not allowed");
  });

  test("should report the first non-canonical locale when multiple are invalid", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en_US", "de_DE"], defaultLocale: "en_US" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('"en_US"');
  });

  test("should catch a non-canonical locale before detecting duplicates", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en_US", "en_US"], defaultLocale: "en_US" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en_US"');
  });

  test("should catch an invalid locale in the list even when default locale is valid", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "fr_FR"], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "fr_FR"');
  });

  test("should return a RMachineError for an uppercase locale", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["EN"], defaultLocale: "EN" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "EN"');
    expect(error?.message).toContain('Did you mean: "en"?');
  });

  test("should return a RMachineError for a lowercase region subtag", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en-us"], defaultLocale: "en-us" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en-us"');
    expect(error?.message).toContain('Did you mean: "en-US"?');
  });

  test("should return a RMachineError for an empty string locale in the array", () => {
    const error = validateRMachineConfig(makeConfig({ locales: [""], defaultLocale: "" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: ""');
    expect(error?.message).toContain('Did you mean: "und"?');
  });

  test("should return a RMachineError for an empty string defaultLocale", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en"], defaultLocale: "" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: ""');
    expect(error?.message).toContain('Did you mean: "und"?');
  });

  test("should return null for valid locales with script subtags", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["zh-Hans", "zh-Hant"], defaultLocale: "zh-Hans" }));
    expect(error).toBeNull();
  });

  test("should return null for a valid config with private use extensions", () => {
    const error = validateRMachineConfig(
      makeConfig({ locales: ["en-US-x-private", "it"], defaultLocale: "en-US-x-private" })
    );
    expect(error).toBeNull();
  });

  test("should return null for a valid config with Unicode extensions", () => {
    const error = validateRMachineConfig(
      makeConfig({ locales: ["en-u-ca-buddhist", "it"], defaultLocale: "en-u-ca-buddhist" })
    );
    expect(error).toBeNull();
  });

  test("should return null for a valid default locale with region subtag", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en-US", "it"], defaultLocale: "en-US" }));
    expect(error).toBeNull();
  });

  test("should detect duplicates when multiple pairs are duplicated", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "it", "en", "it"], defaultLocale: "en" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Duplicate locales provided");
  });

  test("should return null for a large number of valid locales", () => {
    const locales = [
      "en",
      "it",
      "fr",
      "de",
      "es",
      "pt",
      "ja",
      "ko",
      "zh-Hans",
      "zh-Hant",
      "ar",
      "hi",
      "ru",
      "pl",
      "nl",
    ];
    const error = validateRMachineConfig(makeConfig({ locales, defaultLocale: "en" }));
    expect(error).toBeNull();
  });

  test("should return a RMachineError for a wildcard default locale", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en"], defaultLocale: "*" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Wildcards are not allowed");
  });

  test("should validate default locale canonicality independently from the locales list", () => {
    const error = validateRMachineConfig(makeConfig({ locales: ["en", "it"], defaultLocale: "EN" }));
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "EN"');
    expect(error?.message).toContain('Did you mean: "en"?');
  });
});

describe("cloneRMachineConfig", () => {
  test("should return a new object with the same values", () => {
    const original = makeConfig();
    const cloned = cloneRMachineConfig(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  test("should create a shallow copy of the locales array", () => {
    const original = makeConfig();
    const cloned = cloneRMachineConfig(original);

    expect(cloned.locales).toEqual(original.locales);
    expect(cloned.locales).not.toBe(original.locales);
  });

  test("should share the same rModuleResolver reference", () => {
    const original = makeConfig();
    const cloned = cloneRMachineConfig(original);

    expect(cloned.rModuleResolver).toBe(original.rModuleResolver);
  });

  test("should preserve the defaultLocale value", () => {
    const original = makeConfig({ defaultLocale: "it", locales: ["en", "it"] });
    const cloned = cloneRMachineConfig(original);

    expect(cloned.defaultLocale).toBe("it");
  });

  test("mutations to the cloned locales array should not affect the original", () => {
    const original = makeConfig({ locales: ["en", "it"] });
    const cloned = cloneRMachineConfig(original);

    (cloned.locales as string[]).push("fr");

    expect(original.locales).toEqual(["en", "it"]);
    expect(cloned.locales).toEqual(["en", "it", "fr"]);
  });

  test("mutations to the original locales array should not affect the clone", () => {
    const original = makeConfig({ locales: ["en", "it"] });
    const cloned = cloneRMachineConfig(original);

    (original.locales as string[]).push("de");

    expect(cloned.locales).toEqual(["en", "it"]);
    expect(original.locales).toEqual(["en", "it", "de"]);
  });

  test("should correctly clone a config with many locales", () => {
    const locales = ["en", "it", "fr", "de", "es", "pt", "ja", "ko", "zh-Hans"];
    const original = makeConfig({ locales, defaultLocale: "en" });
    const cloned = cloneRMachineConfig(original);

    expect(cloned.locales).toEqual(locales);
    expect(cloned.locales).not.toBe(original.locales);
  });

  test("should correctly clone a config with a single locale", () => {
    const original = makeConfig({ locales: ["en"], defaultLocale: "en" });
    const cloned = cloneRMachineConfig(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.locales).not.toBe(original.locales);
  });
});

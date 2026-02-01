import { describe, expect, test } from "vitest";
import { RMachineError } from "#r-machine/errors";
import { cloneRMachineConfig, type RMachineConfig, validateRMachineConfig } from "./r-machine-config.js";

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
});

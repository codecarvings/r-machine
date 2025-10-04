import { describe, expect, test } from "vitest";
import { type RMachineConfig, validateRMachineConfig } from "../r-machine-config.js";
import { RMachineError } from "../r-machine-error.js";

describe("validateRMachineConfig", () => {
  test("should return an RMachineError if no locales are provided", () => {
    const config: RMachineConfig = {
      locales: [],
      fallbackLocale: "en",
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("No locales provided");
  });

  test("should return an RMachineError if locales contains duplicates", () => {
    const config: RMachineConfig = {
      locales: ["en", "it", "en"],
      fallbackLocale: "en",
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Duplicate locales provided");
  });

  test("should return an RMachineError if fallback locale is not in the list of locales", () => {
    const config: RMachineConfig = {
      locales: ["it"],
      fallbackLocale: "en",
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain(`Fallback locale "en" is not in the list of locales`);
  });

  test("should return an RMachineError if a locale is not canonical", () => {
    const config: RMachineConfig = {
      locales: ["en_US"],
      fallbackLocale: "en_US",
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en_US"');
    expect(error?.message).toContain('Did you mean: "en-US"?');
  });

  test("should return an RMachineError if fallback locale is not canonical", () => {
    const config: RMachineConfig = {
      locales: ["en", "it"],
      fallbackLocale: "en_US",
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en_US"');
    expect(error?.message).toContain('Did you mean: "en-US"?');
  });

  test("should return null for valid canonical locale IDs", () => {
    const config: RMachineConfig = {
      locales: ["en", "en-US", "it", "de-DE"],
      fallbackLocale: "en",
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeNull();
  });
});

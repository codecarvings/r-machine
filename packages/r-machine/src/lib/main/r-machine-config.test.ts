import { describe, expect, test } from "vitest";
import { RMachineError } from "../../common.js";
import { type RMachineConfig, validateRMachineConfig } from "./r-machine-config.js";

describe("validateRMachineConfig", () => {
  test("should return an RMachineError if no locales are provided", () => {
    const config: RMachineConfig = {
      locales: [],
      defaultLocale: "en",
      rModuleResolver: async (namespace, locale) => {
        return { default: { message: `${namespace} in ${locale}` } };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("No locales provided");
  });

  test("should return an RMachineError if locales contains duplicates", () => {
    const config: RMachineConfig = {
      locales: ["en", "it", "en"],
      defaultLocale: "en",
      rModuleResolver: async (namespace, locale) => {
        return { default: { message: `${namespace} in ${locale}` } };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain("Duplicate locales provided");
  });

  test("should return an RMachineError if default locale is not in the list of locales", () => {
    const config: RMachineConfig = {
      locales: ["it"],
      defaultLocale: "en",
      rModuleResolver: async (namespace, locale) => {
        return { default: { message: `${namespace} in ${locale}` } };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain(`Default locale "en" is not in the list of locales`);
  });

  test("should return an RMachineError if a locale is not canonical", () => {
    const config: RMachineConfig = {
      locales: ["en_US"],
      defaultLocale: "en_US",
      rModuleResolver: async (namespace, locale) => {
        return { default: { message: `${namespace} in ${locale}` } };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toContain('Invalid locale identifier: "en_US"');
    expect(error?.message).toContain('Did you mean: "en-US"?');
  });

  test("should return an RMachineError if default locale is not canonical", () => {
    const config: RMachineConfig = {
      locales: ["en", "it"],
      defaultLocale: "en_US",
      rModuleResolver: async (namespace, locale) => {
        return { default: { message: `${namespace} in ${locale}` } };
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
      defaultLocale: "en",
      rModuleResolver: async (namespace, locale) => {
        return { default: { message: `${namespace} in ${locale}` } };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeNull();
  });
});

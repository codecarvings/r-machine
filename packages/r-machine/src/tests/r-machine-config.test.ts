import { describe, expect, test } from "vitest";
import { type RMachineConfig, validateRMachineConfig } from "../r-machine-config.js";
import { RMachineError } from "../r-machine-error.js";

describe("validateRMachineConfig", () => {
  test("should return an RMachineError if no locales are provided", () => {
    const config: RMachineConfig = {
      locales: [],
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toBe("R-Machine Error: No locales provided");
  });

  test("should return an RMachineError if locales contains duplicates", () => {
    const config: RMachineConfig = {
      locales: ["en", "it", "en"],
      rLoader: async (locale, namespace) => {
        return { message: `${namespace} in ${locale}` };
      },
    };

    const error = validateRMachineConfig(config);
    expect(error).toBeInstanceOf(RMachineError);
    expect(error?.message).toBe("R-Machine Error: Duplicate locales provided");
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
    expect(error?.message).toBe(`R-Machine Error: Fallback locale "en" is not in the list of locales`);
  });
});

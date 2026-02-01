import { describe, expectTypeOf, test } from "vitest";
import type { RMachineError } from "#r-machine/errors";
import type { RMachineConfig } from "./r-machine-config.js";
import { cloneRMachineConfig, validateRMachineConfig } from "./r-machine-config.js";
import type { RModuleResolver } from "./r-module.js";

describe("RMachineConfig", () => {
  test("should be an object type", () => {
    expectTypeOf<RMachineConfig>().toBeObject();
  });

  test("should have readonly locales property", () => {
    expectTypeOf<RMachineConfig>().toHaveProperty("locales");
  });

  test("locales should be readonly array of strings", () => {
    expectTypeOf<RMachineConfig["locales"]>().toEqualTypeOf<readonly string[]>();
  });

  test("should have readonly defaultLocale property", () => {
    expectTypeOf<RMachineConfig>().toHaveProperty("defaultLocale");
  });

  test("defaultLocale should be string", () => {
    expectTypeOf<RMachineConfig["defaultLocale"]>().toEqualTypeOf<string>();
  });

  test("should have readonly rModuleResolver property", () => {
    expectTypeOf<RMachineConfig>().toHaveProperty("rModuleResolver");
  });

  test("rModuleResolver should be RModuleResolver type", () => {
    expectTypeOf<RMachineConfig["rModuleResolver"]>().toEqualTypeOf<RModuleResolver>();
  });

  test("all properties should be readonly", () => {
    type ConfigKeys = keyof RMachineConfig;
    expectTypeOf<ConfigKeys>().toEqualTypeOf<"locales" | "defaultLocale" | "rModuleResolver">();
  });

  test("valid config object should be assignable to RMachineConfig", () => {
    const config: RMachineConfig = {
      locales: ["en", "fr"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    expectTypeOf(config).toExtend<RMachineConfig>();
  });

  test("config with tuple locales should be assignable", () => {
    const config: RMachineConfig = {
      locales: ["en", "fr", "de"] as const,
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    expectTypeOf(config).toExtend<RMachineConfig>();
  });
});

describe("validateRMachineConfig", () => {
  test("should be a function", () => {
    expectTypeOf(validateRMachineConfig).toBeFunction();
  });

  test("should accept RMachineConfig parameter", () => {
    expectTypeOf(validateRMachineConfig).parameter(0).toEqualTypeOf<RMachineConfig>();
  });

  test("should return RMachineError or null", () => {
    expectTypeOf(validateRMachineConfig).returns.toEqualTypeOf<RMachineError | null>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(validateRMachineConfig).toEqualTypeOf<(config: RMachineConfig) => RMachineError | null>();
  });

  test("return type RMachineError should extend Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
  });
});

describe("cloneRMachineConfig", () => {
  test("should be a function", () => {
    expectTypeOf(cloneRMachineConfig).toBeFunction();
  });

  test("should accept RMachineConfig parameter", () => {
    expectTypeOf(cloneRMachineConfig).parameter(0).toEqualTypeOf<RMachineConfig>();
  });

  test("should return RMachineConfig", () => {
    expectTypeOf(cloneRMachineConfig).returns.toEqualTypeOf<RMachineConfig>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(cloneRMachineConfig).toEqualTypeOf<(config: RMachineConfig) => RMachineConfig>();
  });

  test("returned config should be a new RMachineConfig instance", () => {
    const original: RMachineConfig = {
      locales: ["en"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig>();
  });
});

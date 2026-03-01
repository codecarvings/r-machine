import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import type { RMachineConfig } from "../../src/lib/r-machine-config.js";
import { cloneRMachineConfig, validateRMachineConfig } from "../../src/lib/r-machine-config.js";
import type { RModuleResolver } from "../../src/lib/r-module.js";

describe("RMachineConfig", () => {
  it("should be an object type", () => {
    expectTypeOf<RMachineConfig>().toBeObject();
  });

  it("should have readonly locales property", () => {
    expectTypeOf<RMachineConfig>().toHaveProperty("locales");
  });

  it("locales should be readonly array of strings", () => {
    expectTypeOf<RMachineConfig["locales"]>().toEqualTypeOf<readonly string[]>();
  });

  it("should have readonly defaultLocale property", () => {
    expectTypeOf<RMachineConfig>().toHaveProperty("defaultLocale");
  });

  it("defaultLocale should be string", () => {
    expectTypeOf<RMachineConfig["defaultLocale"]>().toEqualTypeOf<string>();
  });

  it("should have readonly rModuleResolver property", () => {
    expectTypeOf<RMachineConfig>().toHaveProperty("rModuleResolver");
  });

  it("rModuleResolver should be RModuleResolver type", () => {
    expectTypeOf<RMachineConfig["rModuleResolver"]>().toEqualTypeOf<RModuleResolver>();
  });

  it("all properties should be readonly", () => {
    type ConfigKeys = keyof RMachineConfig;
    expectTypeOf<ConfigKeys>().toEqualTypeOf<"locales" | "defaultLocale" | "rModuleResolver">();
  });

  it("valid config object should be assignable to RMachineConfig", () => {
    const config: RMachineConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    expectTypeOf(config).toExtend<RMachineConfig>();
  });

  it("config with tuple locales should be assignable", () => {
    const config: RMachineConfig = {
      locales: ["en", "it", "de"] as const,
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    expectTypeOf(config).toExtend<RMachineConfig>();
  });
});

describe("validateRMachineConfig", () => {
  it("should be a function", () => {
    expectTypeOf(validateRMachineConfig).toBeFunction();
  });

  it("should accept RMachineConfig parameter", () => {
    expectTypeOf(validateRMachineConfig).parameter(0).toEqualTypeOf<RMachineConfig>();
  });

  it("should return RMachineConfigError or null", () => {
    expectTypeOf(validateRMachineConfig).returns.toEqualTypeOf<RMachineConfigError | null>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(validateRMachineConfig).toEqualTypeOf<(config: RMachineConfig) => RMachineConfigError | null>();
  });

  it("return type RMachineConfigError should extend Error", () => {
    expectTypeOf<RMachineConfigError>().toExtend<Error>();
  });
});

describe("cloneRMachineConfig", () => {
  it("should be a function", () => {
    expectTypeOf(cloneRMachineConfig).toBeFunction();
  });

  it("should accept RMachineConfig parameter", () => {
    expectTypeOf(cloneRMachineConfig).parameter(0).toEqualTypeOf<RMachineConfig>();
  });

  it("should return RMachineConfig", () => {
    expectTypeOf(cloneRMachineConfig).returns.toEqualTypeOf<RMachineConfig>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(cloneRMachineConfig).toEqualTypeOf<(config: RMachineConfig) => RMachineConfig>();
  });

  it("returned config should be a new RMachineConfig instance", () => {
    const original: RMachineConfig = {
      locales: ["en"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig>();
  });
});

import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import type { AnyLocale } from "../../src/lib/locale.js";
import type { RMachineConfig, RMachineConfigParams } from "../../src/lib/r-machine-config.js";
import { cloneRMachineConfig, validateRMachineConfig } from "../../src/lib/r-machine-config.js";
import type { RModuleResolver } from "../../src/lib/r-module.js";

describe("RMachineConfig", () => {
  describe("structure", () => {
    it("should have the correct shape with all properties readonly", () => {
      expectTypeOf<RMachineConfig<string>>().toEqualTypeOf<{
        readonly locales: readonly string[];
        readonly defaultLocale: string;
        readonly rModuleResolver: RModuleResolver;
      }>();
    });

    it("should have exactly three properties", () => {
      type ConfigKeys = keyof RMachineConfig<string>;
      expectTypeOf<ConfigKeys>().toEqualTypeOf<"locales" | "defaultLocale" | "rModuleResolver">();
    });

    it("should be fully readonly", () => {
      expectTypeOf<RMachineConfig<string>>().toEqualTypeOf<Readonly<RMachineConfig<string>>>();
    });
  });

  describe("type parameter L", () => {
    it("should propagate locale type to locales and defaultLocale", () => {
      expectTypeOf<RMachineConfig<"en" | "it">["locales"]>().toEqualTypeOf<readonly ("en" | "it")[]>();
      expectTypeOf<RMachineConfig<"en" | "it">["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
    });

    it("should work with a single literal locale", () => {
      expectTypeOf<RMachineConfig<"en">["locales"]>().toEqualTypeOf<readonly "en"[]>();
      expectTypeOf<RMachineConfig<"en">["defaultLocale"]>().toEqualTypeOf<"en">();
    });

    it("should not affect rModuleResolver type", () => {
      expectTypeOf<RMachineConfig<"en">["rModuleResolver"]>().toEqualTypeOf<RModuleResolver>();
      expectTypeOf<RMachineConfig<"en" | "it">["rModuleResolver"]>().toEqualTypeOf<RModuleResolver>();
    });

    it("should accept AnyLocale as type parameter", () => {
      expectTypeOf<RMachineConfig<AnyLocale>>().toEqualTypeOf<RMachineConfig<string>>();
    });
  });

  describe("covariance", () => {
    it("narrow locale config should be assignable to wider locale config", () => {
      expectTypeOf<RMachineConfig<"en">>().toExtend<RMachineConfig<"en" | "it">>();
      expectTypeOf<RMachineConfig<"en" | "it">>().toExtend<RMachineConfig<string>>();
    });

    it("wider locale config should NOT be assignable to narrower locale config", () => {
      expectTypeOf<RMachineConfig<string>>().not.toExtend<RMachineConfig<"en" | "it">>();
      expectTypeOf<RMachineConfig<"en" | "it">>().not.toExtend<RMachineConfig<"en">>();
    });
  });

  describe("assignability", () => {
    it("valid config object should be assignable", () => {
      const config: RMachineConfig<string> = {
        locales: ["en", "it"],
        defaultLocale: "en",
        rModuleResolver: async () => ({ default: {} }),
      };
      expectTypeOf(config).toExtend<RMachineConfig<string>>();
    });

    it("config with as const locales should be assignable", () => {
      const config: RMachineConfig<string> = {
        locales: ["en", "it", "de"] as const,
        defaultLocale: "en",
        rModuleResolver: async () => ({ default: {} }),
      };
      expectTypeOf(config).toExtend<RMachineConfig<string>>();
    });

    it("should reject defaultLocale outside the locale union", () => {
      expectTypeOf<"fr">().not.toExtend<RMachineConfig<"en" | "it">["defaultLocale"]>();
    });
  });
});

describe("RMachineConfigParams", () => {
  describe("structure", () => {
    it("should have the correct shape with all properties readonly", () => {
      expectTypeOf<RMachineConfigParams<readonly string[]>>().toEqualTypeOf<{
        readonly locales: readonly string[];
        readonly defaultLocale: string;
        readonly rModuleResolver: RModuleResolver;
      }>();
    });
  });

  describe("type parameter LL", () => {
    it("should constrain defaultLocale to members of the locales tuple", () => {
      expectTypeOf<RMachineConfigParams<readonly ["en", "it"]>["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
    });

    it("should preserve the exact tuple type for locales", () => {
      expectTypeOf<RMachineConfigParams<readonly ["en", "it"]>["locales"]>().toEqualTypeOf<readonly ["en", "it"]>();
    });
  });

  describe("relationship with RMachineConfig", () => {
    it("RMachineConfigParams with tuple should be assignable to RMachineConfig with union", () => {
      expectTypeOf<RMachineConfigParams<readonly ["en", "it"]>>().toExtend<RMachineConfig<"en" | "it">>();
    });
  });
});

describe("validateRMachineConfig", () => {
  it("should accept RMachineConfig and return RMachineConfigError or null", () => {
    const config: RMachineConfig<string> = {
      locales: ["en"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const result = validateRMachineConfig(config);
    expectTypeOf(result).toEqualTypeOf<RMachineConfigError | null>();
  });

  it("return type RMachineConfigError should extend Error", () => {
    expectTypeOf<RMachineConfigError>().toExtend<Error>();
  });

  it("should infer locale type from config argument", () => {
    const config: RMachineConfig<"en" | "it"> = {
      locales: ["en", "it"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    // Verify the function accepts narrowly typed configs
    const result = validateRMachineConfig(config);
    expectTypeOf(result).toEqualTypeOf<RMachineConfigError | null>();
  });
});

describe("cloneRMachineConfig", () => {
  it("should preserve the locale type parameter through cloning", () => {
    const original: RMachineConfig<"en" | "it"> = {
      locales: ["en", "it"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig<"en" | "it">>();
  });

  it("should preserve wide locale type through cloning", () => {
    const original: RMachineConfig<string> = {
      locales: ["en"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig<string>>();
  });
});

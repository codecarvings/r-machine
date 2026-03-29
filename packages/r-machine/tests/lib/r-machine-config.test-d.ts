import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { RMachineConfig, RMachineConfigParams } from "../../src/lib/r-machine-config.js";
import { cloneRMachineConfig, validateRMachineConfig } from "../../src/lib/r-machine-config.js";
import type { RModuleResolver } from "../../src/lib/r-module.js";
import type { AnyResourceAtlas, AnyResourceAtlasCtor } from "../../src/lib/resource-atlas.js";

describe("RMachineConfig", () => {
  describe("structure", () => {
    it("should have the correct shape with all properties readonly", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, string>>().toEqualTypeOf<{
        readonly resourceAtlas?: AnyResourceAtlas;
        readonly locales: readonly string[];
        readonly defaultLocale: string;
        readonly rModuleResolver: RModuleResolver;
      }>();
    });

    it("should have exactly four properties", () => {
      type ConfigKeys = keyof RMachineConfig<AnyResourceAtlas, string>;
      expectTypeOf<ConfigKeys>().toEqualTypeOf<"resourceAtlas" | "locales" | "defaultLocale" | "rModuleResolver">();
    });

    it("should be fully readonly", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, string>>().toEqualTypeOf<
        Readonly<RMachineConfig<AnyResourceAtlas, string>>
      >();
    });
  });

  describe("type parameter L", () => {
    it("should propagate locale type to locales and defaultLocale", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it">["locales"]>().toEqualTypeOf<
        readonly ("en" | "it")[]
      >();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it">["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
    });

    it("should work with a single literal locale", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en">["locales"]>().toEqualTypeOf<readonly "en"[]>();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en">["defaultLocale"]>().toEqualTypeOf<"en">();
    });

    it("should not affect rModuleResolver type", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en">["rModuleResolver"]>().toEqualTypeOf<RModuleResolver>();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it">["rModuleResolver"]>().toEqualTypeOf<RModuleResolver>();
    });

    it("should accept AnyLocale as type parameter", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, AnyLocale>>().toEqualTypeOf<
        RMachineConfig<AnyResourceAtlas, string>
      >();
    });
  });

  describe("covariance", () => {
    it("narrow locale config should be assignable to wider locale config", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en">>().toExtend<RMachineConfig<AnyResourceAtlas, "en" | "it">>();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it">>().toExtend<
        RMachineConfig<AnyResourceAtlas, string>
      >();
    });

    it("wider locale config should NOT be assignable to narrower locale config", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, string>>().not.toExtend<
        RMachineConfig<AnyResourceAtlas, "en" | "it">
      >();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it">>().not.toExtend<
        RMachineConfig<AnyResourceAtlas, "en">
      >();
    });
  });

  describe("assignability", () => {
    it("valid config object should be assignable", () => {
      const config: RMachineConfig<AnyResourceAtlas, string> = {
        locales: ["en", "it"],
        defaultLocale: "en",
        rModuleResolver: async () => ({ default: {} }),
      };
      expectTypeOf(config).toExtend<RMachineConfig<AnyResourceAtlas, string>>();
    });

    it("config with as const locales should be assignable", () => {
      const config: RMachineConfig<AnyResourceAtlas, string> = {
        locales: ["en", "it", "de"] as const,
        defaultLocale: "en",
        rModuleResolver: async () => ({ default: {} }),
      };
      expectTypeOf(config).toExtend<RMachineConfig<AnyResourceAtlas, string>>();
    });

    it("should reject defaultLocale outside the locale union", () => {
      expectTypeOf<"fr">().not.toExtend<RMachineConfig<AnyResourceAtlas, "en" | "it">["defaultLocale"]>();
    });
  });
});

describe("RMachineConfigParams", () => {
  describe("structure", () => {
    it("should have the correct shape with all properties readonly", () => {
      expectTypeOf<RMachineConfigParams<AnyResourceAtlasCtor, readonly string[]>>().toEqualTypeOf<{
        readonly ResourceAtlas: AnyResourceAtlasCtor;
        readonly locales: readonly string[];
        readonly defaultLocale: string;
        readonly rModuleResolver: RModuleResolver;
      }>();
    });
  });

  describe("type parameter LL", () => {
    it("should constrain defaultLocale to members of the locales tuple", () => {
      expectTypeOf<RMachineConfigParams<AnyResourceAtlasCtor, readonly ["en", "it"]>["defaultLocale"]>().toEqualTypeOf<
        "en" | "it"
      >();
    });

    it("should preserve the exact tuple type for locales", () => {
      expectTypeOf<RMachineConfigParams<AnyResourceAtlasCtor, readonly ["en", "it"]>["locales"]>().toEqualTypeOf<
        readonly ["en", "it"]
      >();
    });
  });

  describe("relationship with RMachineConfig", () => {
    it("RMachineConfigParams with tuple should be assignable to RMachineConfig with union", () => {
      expectTypeOf<RMachineConfigParams<AnyResourceAtlasCtor, readonly ["en", "it"]>>().toExtend<
        RMachineConfig<AnyResourceAtlas, "en" | "it">
      >();
    });
  });
});

describe("validateRMachineConfig", () => {
  it("should accept RMachineConfig and return RMachineConfigError or null", () => {
    const config: RMachineConfig<AnyResourceAtlas, string> = {
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
    const config: RMachineConfig<AnyResourceAtlas, "en" | "it"> = {
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
    const original: RMachineConfig<AnyResourceAtlas, "en" | "it"> = {
      locales: ["en", "it"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it">>();
  });

  it("should preserve wide locale type through cloning", () => {
    const original: RMachineConfig<AnyResourceAtlas, string> = {
      locales: ["en"],
      defaultLocale: "en",
      rModuleResolver: async () => ({ default: {} }),
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig<AnyResourceAtlas, string>>();
  });
});

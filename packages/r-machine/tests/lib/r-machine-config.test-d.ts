import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { RMachineConfig, RMachineConfigParams } from "../../src/lib/r-machine-config.js";
import { cloneRMachineConfig, validateRMachineConfig } from "../../src/lib/r-machine-config.js";
import type { RModuleLoader } from "../../src/lib/r-module.js";
import type { AnyResourceAtlas } from "../../src/lib/resource-atlas.js";

describe("RMachineConfig", () => {
  describe("structure", () => {
    it("should have the correct shape with all properties readonly", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, string, {}>>().toEqualTypeOf<{
        readonly resourceAtlas: AnyResourceAtlas;
        readonly locales: readonly string[];
        readonly defaultLocale: string;
        readonly load: RModuleLoader;
        readonly kit: {};
      }>();
    });

    it("should have exactly five properties", () => {
      type ConfigKeys = keyof RMachineConfig<AnyResourceAtlas, string, {}>;
      expectTypeOf<ConfigKeys>().toEqualTypeOf<"resourceAtlas" | "locales" | "defaultLocale" | "load" | "kit">();
    });

    it("should be fully readonly", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, string, {}>>().toEqualTypeOf<
        Readonly<RMachineConfig<AnyResourceAtlas, string, {}>>
      >();
    });
  });

  describe("type parameter L", () => {
    it("should propagate locale type to locales and defaultLocale", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it", {}>["locales"]>().toEqualTypeOf<
        readonly ("en" | "it")[]
      >();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it", {}>["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
    });

    it("should work with a single literal locale", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en", {}>["locales"]>().toEqualTypeOf<readonly "en"[]>();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en", {}>["defaultLocale"]>().toEqualTypeOf<"en">();
    });

    it("should not affect load type", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en", {}>["load"]>().toEqualTypeOf<RModuleLoader>();
    });

    it("should accept AnyLocale as type parameter", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, AnyLocale, {}>>().toEqualTypeOf<
        RMachineConfig<AnyResourceAtlas, string, {}>
      >();
    });
  });

  describe("covariance", () => {
    it("narrow locale config should be assignable to wider locale config", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en", {}>>().toExtend<
        RMachineConfig<AnyResourceAtlas, "en" | "it", {}>
      >();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it", {}>>().toExtend<
        RMachineConfig<AnyResourceAtlas, string, {}>
      >();
    });

    it("wider locale config should NOT be assignable to narrower locale config", () => {
      expectTypeOf<RMachineConfig<AnyResourceAtlas, string, {}>>().not.toExtend<
        RMachineConfig<AnyResourceAtlas, "en" | "it", {}>
      >();
      expectTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it", {}>>().not.toExtend<
        RMachineConfig<AnyResourceAtlas, "en", {}>
      >();
    });
  });

  describe("assignability", () => {
    it("valid config object should be assignable", () => {
      const config: RMachineConfig<AnyResourceAtlas, string, {}> = {
        resourceAtlas: {},
        locales: ["en", "it"],
        defaultLocale: "en",
        load: async () => ({ r: {} }),
        kit: {},
      };
      expectTypeOf(config).toExtend<RMachineConfig<AnyResourceAtlas, string, {}>>();
    });

    it("should reject defaultLocale outside the locale union", () => {
      expectTypeOf<"fr">().not.toExtend<RMachineConfig<AnyResourceAtlas, "en" | "it", {}>["defaultLocale"]>();
    });
  });
});

describe("RMachineConfigParams", () => {
  describe("structure", () => {
    it("should have resourceAtlas instead of ResourceAtlas constructor", () => {
      type Params = RMachineConfigParams<AnyResourceAtlas, readonly string[], {}>;
      expectTypeOf<Params>().toHaveProperty("resourceAtlas");
    });

    it("should have optional kit property", () => {
      const params: RMachineConfigParams<AnyResourceAtlas, readonly string[], {}> = {
        resourceAtlas: {},
        locales: ["en"],
        defaultLocale: "en",
        load: async () => ({ r: {} }),
        // kit is optional
      };
      expectTypeOf(params).toBeObject();
    });
  });

  describe("type parameter LL", () => {
    it("should constrain defaultLocale to members of the locales tuple", () => {
      expectTypeOf<RMachineConfigParams<AnyResourceAtlas, readonly ["en", "it"], {}>["defaultLocale"]>().toEqualTypeOf<
        "en" | "it"
      >();
    });

    it("should preserve the exact tuple type for locales", () => {
      expectTypeOf<RMachineConfigParams<AnyResourceAtlas, readonly ["en", "it"], {}>["locales"]>().toEqualTypeOf<
        readonly ["en", "it"]
      >();
    });
  });
});

describe("validateRMachineConfig", () => {
  it("should accept RMachineConfig and return RMachineConfigError or null", () => {
    const config: RMachineConfig<AnyResourceAtlas, string, {}> = {
      resourceAtlas: {},
      locales: ["en"],
      defaultLocale: "en",
      load: async () => ({ r: {} }),
      kit: {},
    };
    const result = validateRMachineConfig(config);
    expectTypeOf(result).toEqualTypeOf<RMachineConfigError | null>();
  });

  it("return type RMachineConfigError should extend Error", () => {
    expectTypeOf<RMachineConfigError>().toExtend<Error>();
  });
});

describe("cloneRMachineConfig", () => {
  it("should preserve the locale type parameter through cloning", () => {
    const original: RMachineConfig<AnyResourceAtlas, "en" | "it", {}> = {
      resourceAtlas: {},
      locales: ["en", "it"],
      defaultLocale: "en",
      load: async () => ({ r: {} }),
      kit: {},
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig<AnyResourceAtlas, "en" | "it", {}>>();
  });

  it("should preserve wide locale type through cloning", () => {
    const original: RMachineConfig<AnyResourceAtlas, string, {}> = {
      resourceAtlas: {},
      locales: ["en"],
      defaultLocale: "en",
      load: async () => ({ r: {} }),
      kit: {},
    };
    const cloned = cloneRMachineConfig(original);
    expectTypeOf(cloned).toEqualTypeOf<RMachineConfig<AnyResourceAtlas, string, {}>>();
  });
});

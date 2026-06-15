import { describe, expect, it } from "vitest";
import {
  ERR_DEFAULT_LOCALE_NOT_IN_LIST,
  ERR_DUPLICATE_LOCALES,
  ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED,
  ERR_NO_LOCALES,
} from "#r-machine/errors";
import { type RMachineConfig, validateRMachineConfig } from "../../src/lib/r-machine-config.js";

// validateRMachineConfig is the gate RMachine's constructor runs before wiring
// any managers. Each branch returns a domain RMachineConfigError (or null on
// success). convertRMachineConfigParamsToConfig is covered separately.

function makeConfig(over: Partial<RMachineConfig<any, any, any, any>> = {}): RMachineConfig<any, any, any, any> {
  return {
    instanceName: "cfg-test",
    locales: ["en", "it"],
    defaultLocale: "en",
    resourceAtlas: undefined!,
    load: async () => ({}) as never,
    layout: { "inner/": "gear:inner" },
    priority: [] as never,
    equipment: { bridgeGears: [], gearKit: {}, shellKit: {} } as never,
    experimental: {} as never,
    ...over,
  };
}

describe("validateRMachineConfig", () => {
  it("returns null for a valid config", () => {
    expect(validateRMachineConfig(makeConfig())).toBeNull();
  });

  it("rejects an empty locales list (ERR_NO_LOCALES)", () => {
    const err = validateRMachineConfig(makeConfig({ locales: [] as never }));
    expect(err?.code).toBe(ERR_NO_LOCALES);
  });

  it("rejects a non-canonical locale id in the list", () => {
    // validateCanonicalUnicodeLocaleId rejects e.g. a lowercase region subtag.
    const err = validateRMachineConfig(makeConfig({ locales: ["en", "en-us"] as never }));
    expect(err).not.toBeNull();
  });

  it("rejects duplicate locales (ERR_DUPLICATE_LOCALES)", () => {
    const err = validateRMachineConfig(makeConfig({ locales: ["en", "en"] as never, defaultLocale: "en" as never }));
    expect(err?.code).toBe(ERR_DUPLICATE_LOCALES);
  });

  it("rejects a non-canonical default locale", () => {
    const err = validateRMachineConfig(makeConfig({ locales: ["en"] as never, defaultLocale: "en-us" as never }));
    expect(err).not.toBeNull();
  });

  it("rejects a default locale absent from the list (ERR_DEFAULT_LOCALE_NOT_IN_LIST)", () => {
    const err = validateRMachineConfig(makeConfig({ locales: ["en", "it"] as never, defaultLocale: "fr" as never }));
    expect(err?.code).toBe(ERR_DEFAULT_LOCALE_NOT_IN_LIST);
  });

  it("rejects gear:outer layout entries when outerGear is not enabled (ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED)", () => {
    const err = validateRMachineConfig(
      makeConfig({ layout: { "inner/": "gear:inner", "outer/": "gear:outer" }, experimental: {} as never })
    );
    expect(err?.code).toBe(ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED);
    expect(err?.message).toContain('"outer/"');
  });

  it("accepts gear:outer layout entries when outerGear is enabled", () => {
    expect(
      validateRMachineConfig(
        makeConfig({
          layout: { "inner/": "gear:inner", "outer/": "gear:outer" },
          experimental: { outerGear: "on" } as never,
        })
      )
    ).toBeNull();
  });
});

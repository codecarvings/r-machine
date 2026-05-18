import { describe, expect, it } from "vitest";
import { convertRMachineConfigParamsToConfig } from "../../src/lib/r-machine-config.js";

// `convertRMachineConfigParamsToConfig` is the canonical user-input materialization point.
// User-supplied namespace collections (priority, bridgeGears, gearKit,
// shellKit) may contain `#`-prefixed internal namespaces — these must be
// stripped here so the rest of the runtime sees bare names.

function fakeResourceAtlas(priority: readonly string[]) {
  return {
    layout: { "base/": "gear:base", "outer/": "gear:outer", "shell/": "shell" } as never,
    priority,
  } as never;
}

const baseParams = {
  locales: ["en"] as const,
  defaultLocale: "en",
  load: async () => ({}) as never,
};

describe("convertRMachineConfigParamsToConfig — internal-marker normalization", () => {
  it("strips `#` from priority entries", () => {
    const config = convertRMachineConfigParamsToConfig({
      ...baseParams,
      ResourceAtlas: fakeResourceAtlas(["#base/jwt", "outer/timer"]),
    } as never);

    expect(config.priority).toEqual(["base/jwt", "outer/timer"]);
  });

  it("strips `#` from bridgeGears entries", () => {
    const config = convertRMachineConfigParamsToConfig({
      ...baseParams,
      ResourceAtlas: fakeResourceAtlas([]),
      bridgeGears: ["#base/jwt", "base/foo"],
    } as never);

    expect(config.equipment.bridgeGears).toEqual(["base/jwt", "base/foo"]);
  });

  it("strips `#` from gearKit values", () => {
    const config = convertRMachineConfigParamsToConfig({
      ...baseParams,
      ResourceAtlas: fakeResourceAtlas([]),
      gearKit: { jwt: "#base/jwt", foo: "base/foo" },
    } as never);

    expect(config.equipment.gearKit).toEqual({ jwt: "base/jwt", foo: "base/foo" });
  });

  it("strips `#` from shellKit values", () => {
    const config = convertRMachineConfigParamsToConfig({
      ...baseParams,
      ResourceAtlas: fakeResourceAtlas([]),
      shellKit: { secret: "#shell/lib/secret", fmt: "shell/lib/fmt" },
    } as never);

    expect(config.equipment.shellKit).toEqual({ secret: "shell/lib/secret", fmt: "shell/lib/fmt" });
  });

  it("preserves empty defaults when params omit the optional collections", () => {
    const config = convertRMachineConfigParamsToConfig({
      ...baseParams,
      ResourceAtlas: fakeResourceAtlas([]),
    } as never);

    expect(config.priority).toEqual([]);
    expect(config.equipment.bridgeGears).toEqual([]);
    expect(config.equipment.gearKit).toEqual({});
    expect(config.equipment.shellKit).toEqual({});
  });
});

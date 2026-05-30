import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppOriginStrategyCore } from "#r-machine/next/core/app/origin";
import type { NextAppOriginStrategy } from "../../../src/app/origin/index.js";

type DefaultPA = InstanceType<(typeof NextAppOriginStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppOriginStrategyCore)["defaultConfig"]["localeKey"];

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app/origin barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<
      NextAppOriginStrategy<any, AnyLocale, ResEquipment<any>, ExperimentalFlags, {}, {}, DefaultPA, DefaultLK>
    >().toBeObject();
  });
});

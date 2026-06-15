import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppFlatStrategyCore } from "#r-machine/next/core/app/flat";
import type { NextAppFlatStrategy } from "../../../src/app/flat/index.js";

type DefaultPA = InstanceType<(typeof NextAppFlatStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppFlatStrategyCore)["defaultConfig"]["localeKey"];

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app/flat barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<
      NextAppFlatStrategy<any, AnyLocale, ResEquipment<any>, ExperimentalFlags, {}, {}, DefaultPA, DefaultLK>
    >().toBeObject();
  });
});

import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
// biome-ignore lint/style/useImportType: value import needed to derive default types via typeof
import { NextAppPathStrategyCore } from "#r-machine/next/core/app/path";
import type { NextAppPathStrategy } from "../../../src/app/path/index.js";

type DefaultPA = InstanceType<(typeof NextAppPathStrategyCore)["defaultConfig"]["PathAtlas"]>;
type DefaultLK = (typeof NextAppPathStrategyCore)["defaultConfig"]["localeKey"];

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app/path barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<
      NextAppPathStrategy<any, AnyLocale, ResEquipment<any>, ExperimentalFlags, {}, {}, DefaultPA, DefaultLK>
    >().toBeObject();
  });
});

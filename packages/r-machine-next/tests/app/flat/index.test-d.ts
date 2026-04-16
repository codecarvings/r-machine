import type { AnyResourceAtlas, NamespaceMap } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { NextAppFlatStrategy } from "../../../src/app/flat/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app/flat barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppFlatStrategy<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>>>().toBeObject();
  });
});

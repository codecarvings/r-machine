import type { AnyResourceAtlas, NamespaceMap } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { NextAppPathStrategy } from "../../../src/app/path/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app/path barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppPathStrategy<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>>>().toBeObject();
  });
});

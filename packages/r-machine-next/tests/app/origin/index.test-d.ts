import type { AnyResourceAtlas, NamespaceMap } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import type { NextAppOriginStrategy } from "../../../src/app/origin/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("app/origin barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<NextAppOriginStrategy<AnyResourceAtlas, AnyLocale, NamespaceMap<AnyResourceAtlas>>>().toBeObject();
  });
});

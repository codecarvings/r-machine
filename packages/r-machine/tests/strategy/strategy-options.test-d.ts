import { describe, expectTypeOf, it } from "vitest";
import type { CustomLocaleDetector, CustomLocaleStore } from "../../src/strategy/strategy-options.js";

// Both are plain types. An exact match pins function-ness, parameters, return
// type and (for the store) the readonly members in a single assertion — the
// per-facet `toBeFunction`/`parameters`/`returns`/assignable checks it replaces
// were all subsumed by it.
describe("CustomLocaleDetector", () => {
  it("is () => string | Promise<string> (sync or async)", () => {
    expectTypeOf<CustomLocaleDetector>().toEqualTypeOf<() => string | Promise<string>>();
  });
});

describe("CustomLocaleStore", () => {
  it("is { readonly get; readonly set } with sync-or-async signatures", () => {
    expectTypeOf<CustomLocaleStore>().toEqualTypeOf<{
      readonly get: () => string | undefined | Promise<string | undefined>;
      readonly set: (newLocale: string) => void | Promise<void>;
    }>();
  });
});

import { describe, expectTypeOf, it } from "vitest";
import { validateServerOnlyUsage } from "../../src/internal/validate-server-only-usage.js";

describe("validateServerOnlyUsage", () => {
  it("accepts a string name and returns void", () => {
    expectTypeOf(validateServerOnlyUsage).toEqualTypeOf<(name: string) => void>();
  });
});

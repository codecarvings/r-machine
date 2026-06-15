import { describe, expectTypeOf, it } from "vitest";
import { validateServerOnlyUsage } from "../../src/internal/validate-server-only-usage.js";

describe("validateServerOnlyUsage", () => {
  it("accepts a name and an optional testMode flag, returns void", () => {
    expectTypeOf(validateServerOnlyUsage).toEqualTypeOf<(name: string, testMode?: boolean) => void>();
  });
});

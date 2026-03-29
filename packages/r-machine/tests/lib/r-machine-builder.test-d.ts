import { describe, expectTypeOf, it } from "vitest";
import type { EmptyFmtProvider, FmtProvider } from "../../src/lib/fmt.js";
import type { RMachineExtensions } from "../../src/lib/r-machine-builder.js";

describe("RMachineExtensions", () => {
  it("should have Formatters property", () => {
    expectTypeOf<RMachineExtensions<EmptyFmtProvider>>().toHaveProperty("Formatters");
  });

  it("should accept FmtProviderCtor as Formatters", () => {
    type FP = FmtProvider<string, { n: number }>;
    expectTypeOf<RMachineExtensions<FP>>().toHaveProperty("Formatters");
  });
});

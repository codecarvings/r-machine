import { describe, expectTypeOf, it } from "vitest";
import type { BrandedResource, RMachineConfig, RMachineLocale } from "../../src/lib/index.js";
import {
  CONFIG_ACCESSOR,
  defineLayout,
  dispose,
  enableRMachineDevMode,
  getResolveContext,
  RMachine,
} from "../../src/lib/index.js";

// Barrel test: a single it() verifying export completeness only. Deep type-shape
// tests live in dedicated files (r-machine-config, layout, …).
describe("lib barrel exports", () => {
  it("exports all expected runtime symbols", () => {
    expectTypeOf(getResolveContext).toBeFunction();
    expectTypeOf(enableRMachineDevMode).toBeFunction();
    expectTypeOf(dispose).toBeFunction();
    expectTypeOf(defineLayout).toBeFunction();
    expectTypeOf(RMachine.create).toBeFunction();
    expectTypeOf(CONFIG_ACCESSOR).toBeSymbol();
  });

  it("exports the expected type aliases", () => {
    // RMachineLocale extracts the locale union from an RMachine instance type.
    expectTypeOf<RMachineLocale<RMachine<any, "en" | "it", any, any>>>().toEqualTypeOf<"en" | "it">();

    // RMachineConfig is the materialized config carried by an instance.
    expectTypeOf<RMachineConfig<any, "en", any, any>>().toHaveProperty("defaultLocale");

    // BrandedResource brands a raw resource while preserving its shape.
    expectTypeOf<BrandedResource<{ a: number }>>().toExtend<{ a: number }>();
  });
});

import { describe, expectTypeOf, it } from "vitest";
import type {
  ERR_ASYNC_DISPOSE_NOT_SUPPORTED,
  ERR_CIRCULAR_DEPENDENCY,
  ERR_DEFAULT_LOCALE_NOT_IN_LIST,
  ERR_DUPLICATE_LOCALES,
  ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED,
  ERR_INVALID_ARGUMENTS,
  ERR_INVALID_LOCALE_ID,
  ERR_NO_LOADER_REGISTERED,
  ERR_NO_LOCALES,
  ERR_RESOLVE_FAILED,
  ERR_UNKNOWN_LOCALE,
  ERR_VERTEX_AT_PROCESS_SCOPE,
  ERR_VERTEX_INSTANCE_NOT_FOUND,
  RMachineConfigError,
  RMachineError,
  RMachineResolveError,
  RMachineTypeError,
  RMachineUsageError,
} from "../../src/errors/index.js";

// Barrel test: a single it() verifying export completeness only — every symbol
// the barrel re-exports is present with its broad shape. Detailed shape tests
// live in the dedicated per-symbol *.test-d.ts files.
describe("errors barrel exports", () => {
  it("exports all expected symbols", () => {
    // Error classes.
    expectTypeOf<RMachineError>().toExtend<Error>();
    expectTypeOf<RMachineConfigError>().toExtend<RMachineError>();
    expectTypeOf<RMachineUsageError>().toExtend<RMachineError>();
    expectTypeOf<RMachineResolveError>().toExtend<RMachineError>();

    // Branded diagnostic type.
    expectTypeOf<RMachineTypeError<"msg">>().toHaveProperty("__rMachineTypeError");

    // Every error code, each a literal equal to its name.
    expectTypeOf<typeof ERR_NO_LOCALES>().toEqualTypeOf<"ERR_NO_LOCALES">();
    expectTypeOf<typeof ERR_DUPLICATE_LOCALES>().toEqualTypeOf<"ERR_DUPLICATE_LOCALES">();
    expectTypeOf<typeof ERR_INVALID_LOCALE_ID>().toEqualTypeOf<"ERR_INVALID_LOCALE_ID">();
    expectTypeOf<typeof ERR_DEFAULT_LOCALE_NOT_IN_LIST>().toEqualTypeOf<"ERR_DEFAULT_LOCALE_NOT_IN_LIST">();
    expectTypeOf<typeof ERR_UNKNOWN_LOCALE>().toEqualTypeOf<"ERR_UNKNOWN_LOCALE">();
    expectTypeOf<typeof ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED>().toEqualTypeOf<"ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED">();
    expectTypeOf<typeof ERR_INVALID_ARGUMENTS>().toEqualTypeOf<"ERR_INVALID_ARGUMENTS">();
    expectTypeOf<typeof ERR_ASYNC_DISPOSE_NOT_SUPPORTED>().toEqualTypeOf<"ERR_ASYNC_DISPOSE_NOT_SUPPORTED">();
    expectTypeOf<typeof ERR_NO_LOADER_REGISTERED>().toEqualTypeOf<"ERR_NO_LOADER_REGISTERED">();
    expectTypeOf<typeof ERR_RESOLVE_FAILED>().toEqualTypeOf<"ERR_RESOLVE_FAILED">();
    expectTypeOf<typeof ERR_CIRCULAR_DEPENDENCY>().toEqualTypeOf<"ERR_CIRCULAR_DEPENDENCY">();
    expectTypeOf<typeof ERR_VERTEX_INSTANCE_NOT_FOUND>().toEqualTypeOf<"ERR_VERTEX_INSTANCE_NOT_FOUND">();
    expectTypeOf<typeof ERR_VERTEX_AT_PROCESS_SCOPE>().toEqualTypeOf<"ERR_VERTEX_AT_PROCESS_SCOPE">();
  });
});

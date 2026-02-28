import { describe, expectTypeOf, it } from "vitest";
import type {
  ERR_DEFAULT_LOCALE_NOT_IN_LIST,
  ERR_DUPLICATE_LOCALES,
  ERR_INVALID_LOCALE_ID,
  ERR_NO_LOCALES,
  ERR_RESOLVE_FAILED,
  ERR_UNKNOWN_LOCALE,
  RMachineConfigError,
  RMachineError,
  RMachineResolveError,
  RMachineUsageError,
} from "../../../src/errors/index.js";

describe("errors barrel exports", () => {
  it("should export RMachineError as a class extending Error", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
    expectTypeOf<RMachineError>().toHaveProperty("code");
    expectTypeOf<RMachineError>().toHaveProperty("innerError");
  });

  it("should export RMachineConfigError extending RMachineError", () => {
    expectTypeOf<RMachineConfigError>().toExtend<RMachineError>();
  });

  it("should export RMachineUsageError extending RMachineError", () => {
    expectTypeOf<RMachineUsageError>().toExtend<RMachineError>();
  });

  it("should export RMachineResolveError extending RMachineError", () => {
    expectTypeOf<RMachineResolveError>().toExtend<RMachineError>();
  });

  it("should export error code constants as literal types", () => {
    expectTypeOf<typeof ERR_NO_LOCALES>().toEqualTypeOf<"ERR_NO_LOCALES">();
    expectTypeOf<typeof ERR_DUPLICATE_LOCALES>().toEqualTypeOf<"ERR_DUPLICATE_LOCALES">();
    expectTypeOf<typeof ERR_INVALID_LOCALE_ID>().toEqualTypeOf<"ERR_INVALID_LOCALE_ID">();
    expectTypeOf<typeof ERR_DEFAULT_LOCALE_NOT_IN_LIST>().toEqualTypeOf<"ERR_DEFAULT_LOCALE_NOT_IN_LIST">();
    expectTypeOf<typeof ERR_UNKNOWN_LOCALE>().toEqualTypeOf<"ERR_UNKNOWN_LOCALE">();
    expectTypeOf<typeof ERR_RESOLVE_FAILED>().toEqualTypeOf<"ERR_RESOLVE_FAILED">();
  });
});

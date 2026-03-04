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
} from "../../src/errors/index.js";

describe("errors barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
    expectTypeOf<RMachineError>().toHaveProperty("code");
    expectTypeOf<RMachineError>().toHaveProperty("innerError");

    expectTypeOf<RMachineConfigError>().toExtend<RMachineError>();

    expectTypeOf<RMachineUsageError>().toExtend<RMachineError>();

    expectTypeOf<RMachineResolveError>().toExtend<RMachineError>();

    expectTypeOf<typeof ERR_NO_LOCALES>().toEqualTypeOf<"ERR_NO_LOCALES">();
    expectTypeOf<typeof ERR_DUPLICATE_LOCALES>().toEqualTypeOf<"ERR_DUPLICATE_LOCALES">();
    expectTypeOf<typeof ERR_INVALID_LOCALE_ID>().toEqualTypeOf<"ERR_INVALID_LOCALE_ID">();
    expectTypeOf<typeof ERR_DEFAULT_LOCALE_NOT_IN_LIST>().toEqualTypeOf<"ERR_DEFAULT_LOCALE_NOT_IN_LIST">();
    expectTypeOf<typeof ERR_UNKNOWN_LOCALE>().toEqualTypeOf<"ERR_UNKNOWN_LOCALE">();
    expectTypeOf<typeof ERR_RESOLVE_FAILED>().toEqualTypeOf<"ERR_RESOLVE_FAILED">();
  });
});

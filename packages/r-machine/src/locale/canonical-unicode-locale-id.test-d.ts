import { describe, expectTypeOf, test } from "vitest";
import type { RMachineError } from "#r-machine/errors";
import { getCanonicalUnicodeLocaleId, validateCanonicalUnicodeLocaleId } from "./canonical-unicode-locale-id.js";

describe("getCanonicalUnicodeLocaleId", () => {
  test("should accept string parameter", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).parameter(0).toEqualTypeOf<string>();
  });

  test("should return string", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).returns.toEqualTypeOf<string>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).toEqualTypeOf<(locale: string) => string>();
  });
});

describe("validateCanonicalUnicodeLocaleId", () => {
  test("should accept string parameter", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).parameter(0).toEqualTypeOf<string>();
  });

  test("should return RMachineError or null", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).returns.toEqualTypeOf<RMachineError | null>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).toEqualTypeOf<(locale: string) => RMachineError | null>();
  });

  test("return type should extend Error when not null", () => {
    expectTypeOf<RMachineError>().toExtend<Error>();
  });
});

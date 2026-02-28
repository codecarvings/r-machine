import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import {
  getCanonicalUnicodeLocaleId,
  validateCanonicalUnicodeLocaleId,
} from "../../../src/locale/canonical-unicode-locale-id.js";

describe("getCanonicalUnicodeLocaleId", () => {
  it("should accept string parameter", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).parameter(0).toEqualTypeOf<string>();
  });

  it("should return string", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).returns.toEqualTypeOf<string>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).toEqualTypeOf<(locale: string) => string>();
  });
});

describe("validateCanonicalUnicodeLocaleId", () => {
  it("should accept string parameter", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).parameter(0).toEqualTypeOf<string>();
  });

  it("should return RMachineConfigError or null", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).returns.toEqualTypeOf<RMachineConfigError | null>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).toEqualTypeOf<(locale: string) => RMachineConfigError | null>();
  });

  it("return type should extend Error when not null", () => {
    expectTypeOf<RMachineConfigError>().toExtend<Error>();
  });
});

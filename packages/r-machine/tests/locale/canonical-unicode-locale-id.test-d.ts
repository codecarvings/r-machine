import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import {
  getCanonicalUnicodeLocaleId,
  validateCanonicalUnicodeLocaleId,
} from "../../src/locale/canonical-unicode-locale-id.js";

describe("getCanonicalUnicodeLocaleId", () => {
  it("is (locale: string) => string", () => {
    expectTypeOf(getCanonicalUnicodeLocaleId).toEqualTypeOf<(locale: string) => string>();
  });
});

describe("validateCanonicalUnicodeLocaleId", () => {
  it("is (locale: string) => RMachineConfigError | null", () => {
    expectTypeOf(validateCanonicalUnicodeLocaleId).toEqualTypeOf<(locale: string) => RMachineConfigError | null>();
  });
});

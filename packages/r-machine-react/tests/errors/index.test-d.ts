import { describe, expectTypeOf, it } from "vitest";
import {
  ERR_CONTEXT_NOT_FOUND as OriginalContextNotFound,
  ERR_MISSING_WRITE_LOCALE as OriginalMissingWriteLocale,
} from "../../src/errors/error-codes.js";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "../../src/errors/index.js";

describe("errors barrel exports", () => {
  it("re-exports ERR_CONTEXT_NOT_FOUND identical to the original", () => {
    expectTypeOf(ERR_CONTEXT_NOT_FOUND).toEqualTypeOf(OriginalContextNotFound);
  });

  it("re-exports ERR_MISSING_WRITE_LOCALE identical to the original", () => {
    expectTypeOf(ERR_MISSING_WRITE_LOCALE).toEqualTypeOf(OriginalMissingWriteLocale);
  });
});

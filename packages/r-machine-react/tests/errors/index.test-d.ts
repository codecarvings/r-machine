import { describe, expectTypeOf, it } from "vitest";
import {
  ERR_CONTEXT_NOT_FOUND as OriginalContextNotFound,
  ERR_MISSING_WRITE_LOCALE as OriginalMissingWriteLocale,
} from "../../src/errors/error-codes.js";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "../../src/errors/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("errors barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(ERR_CONTEXT_NOT_FOUND).toEqualTypeOf(OriginalContextNotFound);
    expectTypeOf(ERR_MISSING_WRITE_LOCALE).toEqualTypeOf(OriginalMissingWriteLocale);
  });
});

import { describe, expectTypeOf, it } from "vitest";
import type { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "../../../src/errors/index.js";

describe("errors barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<typeof ERR_CONTEXT_NOT_FOUND>().toEqualTypeOf<"ERR_CONTEXT_NOT_FOUND">();
    expectTypeOf<typeof ERR_MISSING_WRITE_LOCALE>().toEqualTypeOf<"ERR_MISSING_WRITE_LOCALE">();
  });
});

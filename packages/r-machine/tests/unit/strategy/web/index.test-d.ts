import { describe, expectTypeOf, it } from "vitest";
import type { CookieDeclaration } from "../../../../src/strategy/web/index.js";
import { defaultCookieDeclaration } from "../../../../src/strategy/web/index.js";

describe("strategy/web barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<CookieDeclaration>().toBeObject();
    expectTypeOf<CookieDeclaration>().toHaveProperty("name");

    expectTypeOf(defaultCookieDeclaration).toExtend<CookieDeclaration>();
  });
});

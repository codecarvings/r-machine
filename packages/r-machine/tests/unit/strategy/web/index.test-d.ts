import { describe, expectTypeOf, it } from "vitest";
import type { CookieDeclaration } from "../../../../src/strategy/web/index.js";
import { defaultCookieDeclaration } from "../../../../src/strategy/web/index.js";

describe("strategy/web barrel exports", () => {
  it("should export CookieDeclaration as an object type", () => {
    expectTypeOf<CookieDeclaration>().toBeObject();
    expectTypeOf<CookieDeclaration>().toHaveProperty("name");
  });

  it("should export defaultCookieDeclaration as a CookieDeclaration", () => {
    expectTypeOf(defaultCookieDeclaration).toExtend<CookieDeclaration>();
  });
});

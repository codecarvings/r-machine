import type { CookieDeclaration } from "r-machine/strategy/web";
import { describe, expectTypeOf, it } from "vitest";
import { setCookie } from "../../src/internal/set-cookie.js";

describe("setCookie", () => {
  it("accepts (name, value, config) and returns void", () => {
    expectTypeOf(setCookie).toEqualTypeOf<
      (name: string, value: string, config: Omit<CookieDeclaration, "name">) => void
    >();
  });
});

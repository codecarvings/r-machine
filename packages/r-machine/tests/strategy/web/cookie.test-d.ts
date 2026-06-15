import { describe, expectTypeOf, it } from "vitest";
import {
  type CookieDeclaration,
  defaultCookieDeclaration,
  getCookie,
  setCookie,
} from "../../../src/strategy/web/cookie.js";

describe("CookieDeclaration", () => {
  it("pins each field's type (name required, the rest optional)", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("name").toEqualTypeOf<string>();
    expectTypeOf<CookieDeclaration>().toHaveProperty("path").toEqualTypeOf<string | undefined>();
    expectTypeOf<CookieDeclaration>().toHaveProperty("httpOnly").toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CookieDeclaration>().toHaveProperty("secure").toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CookieDeclaration>().toHaveProperty("sameSite").toEqualTypeOf<"lax" | "strict" | "none" | undefined>();
    expectTypeOf<CookieDeclaration>().toHaveProperty("maxAge").toEqualTypeOf<number | undefined>();
    expectTypeOf<CookieDeclaration>().toHaveProperty("domain").toEqualTypeOf<string | undefined>();
  });

  it("requires only `name` — every other field is optional", () => {
    expectTypeOf<{ name: string }>().toExtend<CookieDeclaration>();
  });
});

describe("defaultCookieDeclaration", () => {
  it("is a CookieDeclaration", () => {
    expectTypeOf(defaultCookieDeclaration).toExtend<CookieDeclaration>();
  });
});

describe("getCookie", () => {
  it("is (name: string) => string | undefined", () => {
    expectTypeOf(getCookie).toEqualTypeOf<(name: string) => string | undefined>();
  });
});

describe("setCookie", () => {
  it("is (name: string, value: string, config: Omit<CookieDeclaration, 'name'>) => void", () => {
    expectTypeOf(setCookie).toEqualTypeOf<
      (name: string, value: string, config: Omit<CookieDeclaration, "name">) => void
    >();
  });
});

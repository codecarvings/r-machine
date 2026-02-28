import { describe, expectTypeOf, it } from "vitest";
import { type CookieDeclaration, defaultCookieDeclaration } from "../../../../src/strategy/web/web-options.js";

describe("CookieDeclaration", () => {
  it("should be an object type", () => {
    expectTypeOf<CookieDeclaration>().toBeObject();
  });

  it("name should be readonly string", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("name").toEqualTypeOf<string>();
  });

  it("path should be readonly optional string", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("path").toEqualTypeOf<string | undefined>();
  });

  it("httpOnly should be readonly optional boolean", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("httpOnly").toEqualTypeOf<boolean | undefined>();
  });

  it("secure should be readonly optional boolean", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("secure").toEqualTypeOf<boolean | undefined>();
  });

  it("sameSite should be readonly optional 'lax' | 'strict' | 'none'", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("sameSite").toEqualTypeOf<"lax" | "strict" | "none" | undefined>();
  });

  it("maxAge should be readonly optional number", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("maxAge").toEqualTypeOf<number | undefined>();
  });

  it("domain should be readonly optional string", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("domain").toEqualTypeOf<string | undefined>();
  });

  it("sameSite 'lax' should be assignable", () => {
    expectTypeOf<"lax">().toExtend<CookieDeclaration["sameSite"]>();
  });

  it("sameSite 'strict' should be assignable", () => {
    expectTypeOf<"strict">().toExtend<CookieDeclaration["sameSite"]>();
  });

  it("sameSite 'none' should be assignable", () => {
    expectTypeOf<"none">().toExtend<CookieDeclaration["sameSite"]>();
  });

  it("invalid sameSite value should not be assignable", () => {
    expectTypeOf<"invalid">().not.toExtend<CookieDeclaration["sameSite"]>();
  });

  it("object with only name should be assignable", () => {
    expectTypeOf<{ name: string }>().toExtend<CookieDeclaration>();
  });

  it("object with all properties should be assignable", () => {
    expectTypeOf<{
      name: string;
      path: string;
      httpOnly: boolean;
      secure: boolean;
      sameSite: "strict";
      maxAge: number;
      domain: string;
    }>().toExtend<CookieDeclaration>();
  });
});

describe("defaultCookieDeclaration", () => {
  it("should be of type CookieDeclaration", () => {
    expectTypeOf(defaultCookieDeclaration).toExtend<CookieDeclaration>();
  });

  it("should have name property", () => {
    expectTypeOf(defaultCookieDeclaration).toHaveProperty("name").toBeString();
  });

  it("should have maxAge property matching CookieDeclaration type", () => {
    expectTypeOf(defaultCookieDeclaration).toHaveProperty("maxAge").toEqualTypeOf<number | undefined>();
  });

  it("should have path property matching CookieDeclaration type", () => {
    expectTypeOf(defaultCookieDeclaration).toHaveProperty("path").toEqualTypeOf<string | undefined>();
  });
});

import { describe, expectTypeOf, test } from "vitest";
import { type CookieDeclaration, defaultCookieDeclaration } from "./web-options.js";

describe("CookieDeclaration", () => {
  test("should be an object type", () => {
    expectTypeOf<CookieDeclaration>().toBeObject();
  });

  test("name should be readonly string", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("name").toEqualTypeOf<string>();
  });

  test("path should be readonly optional string", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("path").toEqualTypeOf<string | undefined>();
  });

  test("httpOnly should be readonly optional boolean", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("httpOnly").toEqualTypeOf<boolean | undefined>();
  });

  test("secure should be readonly optional boolean", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("secure").toEqualTypeOf<boolean | undefined>();
  });

  test("sameSite should be readonly optional 'lax' | 'strict' | 'none'", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("sameSite").toEqualTypeOf<"lax" | "strict" | "none" | undefined>();
  });

  test("maxAge should be readonly optional number", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("maxAge").toEqualTypeOf<number | undefined>();
  });

  test("domain should be readonly optional string", () => {
    expectTypeOf<CookieDeclaration>().toHaveProperty("domain").toEqualTypeOf<string | undefined>();
  });

  test("sameSite 'lax' should be assignable", () => {
    expectTypeOf<"lax">().toExtend<CookieDeclaration["sameSite"]>();
  });

  test("sameSite 'strict' should be assignable", () => {
    expectTypeOf<"strict">().toExtend<CookieDeclaration["sameSite"]>();
  });

  test("sameSite 'none' should be assignable", () => {
    expectTypeOf<"none">().toExtend<CookieDeclaration["sameSite"]>();
  });

  test("invalid sameSite value should not be assignable", () => {
    expectTypeOf<"invalid">().not.toExtend<CookieDeclaration["sameSite"]>();
  });

  test("object with only name should be assignable", () => {
    expectTypeOf<{ name: string }>().toExtend<CookieDeclaration>();
  });

  test("object with all properties should be assignable", () => {
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
  test("should be of type CookieDeclaration", () => {
    expectTypeOf(defaultCookieDeclaration).toExtend<CookieDeclaration>();
  });

  test("should have name property", () => {
    expectTypeOf(defaultCookieDeclaration).toHaveProperty("name").toBeString();
  });

  test("should have maxAge property matching CookieDeclaration type", () => {
    expectTypeOf(defaultCookieDeclaration).toHaveProperty("maxAge").toEqualTypeOf<number | undefined>();
  });

  test("should have path property matching CookieDeclaration type", () => {
    expectTypeOf(defaultCookieDeclaration).toHaveProperty("path").toEqualTypeOf<string | undefined>();
  });
});

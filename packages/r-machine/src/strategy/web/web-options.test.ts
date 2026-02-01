import { describe, expect, test } from "vitest";
import { type CookieDeclaration, defaultCookieDeclaration } from "./web-options.js";

describe("defaultCookieDeclaration", () => {
  test("should have name set to 'rm-locale'", () => {
    expect(defaultCookieDeclaration.name).toBe("rm-locale");
  });

  test("should have maxAge set to 30 days in seconds", () => {
    const thirtyDaysInSeconds = 60 * 60 * 24 * 30;
    expect(defaultCookieDeclaration.maxAge).toBe(thirtyDaysInSeconds);
  });

  test("should have path set to '/'", () => {
    expect(defaultCookieDeclaration.path).toBe("/");
  });

  test("should not have httpOnly set", () => {
    expect(defaultCookieDeclaration.httpOnly).toBeUndefined();
  });

  test("should not have secure set", () => {
    expect(defaultCookieDeclaration.secure).toBeUndefined();
  });

  test("should not have sameSite set", () => {
    expect(defaultCookieDeclaration.sameSite).toBeUndefined();
  });

  test("should not have domain set", () => {
    expect(defaultCookieDeclaration.domain).toBeUndefined();
  });

  test("should be a valid CookieDeclaration", () => {
    const cookie: CookieDeclaration = defaultCookieDeclaration;
    expect(cookie).toBeDefined();
    expect(cookie.name).toBeDefined();
  });
});

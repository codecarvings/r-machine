import { describe, expect, it } from "vitest";
import { defaultCookieDeclaration } from "../../../../src/strategy/web/web-options.js";

describe("defaultCookieDeclaration", () => {
  it("should have the expected default values", () => {
    expect(defaultCookieDeclaration).toEqual({
      name: "rm-locale",
      maxAge: 2_592_000,
      path: "/",
    });
  });
});

import { describe, expect, it } from "vitest";
import * as errorCodes from "../../src/errors/error-codes.js";

const codes = Object.values(errorCodes);

describe("error codes", () => {
  it("exports at least one error code", () => {
    expect(codes.length).toBeGreaterThan(0);
  });

  it("all codes are non-empty strings", () => {
    for (const code of codes) {
      expect(code).toBeTypeOf("string");
      expect(code).not.toBe("");
    }
  });

  it("all codes are unique", () => {
    expect(new Set(codes).size).toBe(codes.length);
  });
});

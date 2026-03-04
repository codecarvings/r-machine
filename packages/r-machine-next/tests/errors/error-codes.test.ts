import { describe, expect, it } from "vitest";
import * as errorCodes from "../../src/errors/error-codes.js";

describe("error codes", () => {
  const entries = Object.entries(errorCodes);

  it("exports at least one error code", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s should equal its export name", (name, value) => {
    expect(value).toBe(name);
  });

  it("all codes are unique", () => {
    const values = entries.map(([, v]) => v);
    expect(new Set(values).size).toBe(values.length);
  });
});

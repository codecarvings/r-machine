import { describe, expect, test } from "vitest";
import { typeRef } from "../utils.js";

describe("typeRef", () => {
  test("should return undefined", () => {
    const result = typeRef<string>();
    expect(result).toBeUndefined();
  });
});

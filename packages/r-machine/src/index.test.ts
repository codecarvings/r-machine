import { describe, expect, it } from "vitest";
import { hello } from "./index.js";

describe("hello", () => {
  it('should return "word"', () => {
    expect(hello()).toBe("word");
  });
});

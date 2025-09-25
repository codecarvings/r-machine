import { describe, expectTypeOf, it } from "vitest";
import { hello } from "./index.js";

describe("hello", () => {
  it("should return a string", () => {
    expectTypeOf(hello()).toEqualTypeOf<string>();
  });
});

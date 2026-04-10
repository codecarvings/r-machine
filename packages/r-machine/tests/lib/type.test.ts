import { describe, expect, it } from "vitest";
import { ofType } from "../../lib/type.js";

describe("ofType", () => {
  it("returns undefined at runtime", () => {
    const result = ofType<{ greeting: string }>();
    expect(result).toBeUndefined();
  });

  it("returns undefined regardless of the type parameter", () => {
    expect(ofType<number>()).toBeUndefined();
    expect(ofType<string>()).toBeUndefined();
    expect(ofType<{ complex: { nested: boolean } }>()).toBeUndefined();
  });
});

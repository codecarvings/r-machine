import { describe, expect, test } from "vitest";
import { typeOf } from "../utils.js";

describe("typeOf", () => {
  test("should return undefined", () => {
    const result = typeOf();
    expect(result).toBeUndefined();
  });

  test("should work with any generic type", () => {
    const stringResult = typeOf<string>();
    const numberResult = typeOf<number>();
    const objectResult = typeOf<{ key: string }>();
    const arrayResult = typeOf<string[]>();

    expect(stringResult).toBeUndefined();
    expect(numberResult).toBeUndefined();
    expect(objectResult).toBeUndefined();
    expect(arrayResult).toBeUndefined();
  });

  test("should work with complex types", () => {
    type ComplexType = {
      nested: {
        value: number;
        optional?: string;
      };
      array: boolean[];
    };

    const result = typeOf<ComplexType>();
    expect(result).toBeUndefined();
  });

  test("should work with union types", () => {
    const result = typeOf<string | number | boolean>();
    expect(result).toBeUndefined();
  });

  test("should work with function types", () => {
    const result = typeOf<(x: number) => string>();
    expect(result).toBeUndefined();
  });
});

import { describe, expectTypeOf, test } from "vitest";
import { typeRef } from "../utils.js";

describe("typeRef", () => {
  test("should infer correct type for primitives", () => {
    const stringType = typeRef<string>();
    const numberType = typeRef<number>();
    const booleanType = typeRef<boolean>();

    expectTypeOf(stringType).toEqualTypeOf<string>();
    expectTypeOf(numberType).toEqualTypeOf<number>();
    expectTypeOf(booleanType).toEqualTypeOf<boolean>();
  });

  test("should infer correct type for objects", () => {
    type SimpleObject = { key: string; value: number };
    const objectType = typeRef<SimpleObject>();

    expectTypeOf(objectType).toEqualTypeOf<SimpleObject>();
  });

  test("should infer correct type for arrays", () => {
    const stringArrayType = typeRef<string[]>();
    const numberArrayType = typeRef<number[]>();

    expectTypeOf(stringArrayType).toEqualTypeOf<string[]>();
    expectTypeOf(numberArrayType).toEqualTypeOf<number[]>();
  });

  test("should infer correct type for complex nested objects", () => {
    type Atlas = {
      ns1: { message: string };
      errors: { validation: string; network: string };
      nested: {
        deep: {
          value: number;
          optional?: boolean;
        };
      };
    };

    const atlasType = typeRef<Atlas>();
    expectTypeOf(atlasType).toEqualTypeOf<Atlas>();
  });

  test("should infer correct type for union types", () => {
    type StringOrNumber = string | number;
    type ComplexUnion = { type: "success"; data: string } | { type: "error"; message: string };

    const unionType = typeRef<StringOrNumber>();
    const complexUnionType = typeRef<ComplexUnion>();

    expectTypeOf(unionType).toEqualTypeOf<StringOrNumber>();
    expectTypeOf(complexUnionType).toEqualTypeOf<ComplexUnion>();
  });

  test("should infer correct type for function types", () => {
    type SimpleFunction = (x: number) => string;
    type AsyncFunction = (locale: string, namespace: string) => Promise<Record<string, string>>;

    const simpleFn = typeRef<SimpleFunction>();
    const asyncFn = typeRef<AsyncFunction>();

    expectTypeOf(simpleFn).toEqualTypeOf<SimpleFunction>();
    expectTypeOf(asyncFn).toEqualTypeOf<AsyncFunction>();
  });

  test("should infer correct type for generic constraints", () => {
    type KeyValuePair<K extends string, V> = { key: K; value: V };

    const kvPair = typeRef<KeyValuePair<"test", number>>();
    expectTypeOf(kvPair).toEqualTypeOf<KeyValuePair<"test", number>>();
  });

  test("should work with mapped types", () => {
    type Partial<T> = { [P in keyof T]?: T[P] };
    type TestType = { a: string; b: number };

    const partialType = typeRef<Partial<TestType>>();
    expectTypeOf(partialType).toEqualTypeOf<Partial<TestType>>();
  });
});

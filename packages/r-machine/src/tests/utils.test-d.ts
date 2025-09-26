import { describe, expectTypeOf, test } from "vitest";
import { typeOf } from "../utils.js";

describe("typeOf", () => {
  test("should infer correct type for primitives", () => {
    const stringType = typeOf<string>();
    const numberType = typeOf<number>();
    const booleanType = typeOf<boolean>();

    expectTypeOf(stringType).toEqualTypeOf<string>();
    expectTypeOf(numberType).toEqualTypeOf<number>();
    expectTypeOf(booleanType).toEqualTypeOf<boolean>();
  });

  test("should infer correct type for objects", () => {
    type SimpleObject = { key: string; value: number };
    const objectType = typeOf<SimpleObject>();

    expectTypeOf(objectType).toEqualTypeOf<SimpleObject>();
  });

  test("should infer correct type for arrays", () => {
    const stringArrayType = typeOf<string[]>();
    const numberArrayType = typeOf<number[]>();

    expectTypeOf(stringArrayType).toEqualTypeOf<string[]>();
    expectTypeOf(numberArrayType).toEqualTypeOf<number[]>();
  });

  test("should infer correct type for complex nested objects", () => {
    type Resources = {
      common: { message: string };
      errors: { validation: string; network: string };
      nested: {
        deep: {
          value: number;
          optional?: boolean;
        };
      };
    };

    const resourcesType = typeOf<Resources>();
    expectTypeOf(resourcesType).toEqualTypeOf<Resources>();
  });

  test("should infer correct type for union types", () => {
    type StringOrNumber = string | number;
    type ComplexUnion = { type: "success"; data: string } | { type: "error"; message: string };

    const unionType = typeOf<StringOrNumber>();
    const complexUnionType = typeOf<ComplexUnion>();

    expectTypeOf(unionType).toEqualTypeOf<StringOrNumber>();
    expectTypeOf(complexUnionType).toEqualTypeOf<ComplexUnion>();
  });

  test("should infer correct type for function types", () => {
    type SimpleFunction = (x: number) => string;
    type AsyncFunction = (locale: string, namespace: string) => Promise<Record<string, string>>;

    const simpleFn = typeOf<SimpleFunction>();
    const asyncFn = typeOf<AsyncFunction>();

    expectTypeOf(simpleFn).toEqualTypeOf<SimpleFunction>();
    expectTypeOf(asyncFn).toEqualTypeOf<AsyncFunction>();
  });

  test("should infer correct type for generic constraints", () => {
    type KeyValuePair<K extends string, V> = { key: K; value: V };

    const kvPair = typeOf<KeyValuePair<"test", number>>();
    expectTypeOf(kvPair).toEqualTypeOf<KeyValuePair<"test", number>>();
  });

  test("should work with mapped types", () => {
    type Partial<T> = { [P in keyof T]?: T[P] };
    type TestType = { a: string; b: number };

    const partialType = typeOf<Partial<TestType>>();
    expectTypeOf(partialType).toEqualTypeOf<Partial<TestType>>();
  });
});

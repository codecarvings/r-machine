import { expectTypeOf, test } from "vitest";

test("dummy type test", () => {
  const stringType = "";

  expectTypeOf(stringType).toEqualTypeOf<string>();
});

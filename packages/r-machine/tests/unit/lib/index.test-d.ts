import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNamespace,
  AnyNamespaceList,
  AnyR,
  AnyResourceAtlas,
  AnyRKit,
  Namespace,
  NamespaceList,
  R,
  R$,
  RKit,
  RMachineConfig,
} from "../../../src/lib/index.js";
import { RMachine } from "../../../src/lib/index.js";

describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    type TestAtlas = { readonly common: { greeting: string } };
    type Resource = { greeting: string };

    expectTypeOf<RMachine<AnyResourceAtlas>>().toBeObject();
    expectTypeOf(RMachine).constructorParameters.toEqualTypeOf<[config: RMachineConfig]>();

    expectTypeOf<RMachineConfig>().toBeObject();

    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();

    expectTypeOf<AnyR>().toEqualTypeOf<object>();

    expectTypeOf<AnyResourceAtlas>().toBeObject();

    expectTypeOf<Namespace<TestAtlas>>().toExtend<string>();

    expectTypeOf<R<Resource>>().toExtend<Resource>();

    expectTypeOf<AnyNamespaceList>().toExtend<readonly AnyNamespace[]>();

    expectTypeOf<AnyRKit>().toExtend<readonly AnyR[]>();

    expectTypeOf<NamespaceList<TestAtlas>>().toExtend<readonly string[]>();

    expectTypeOf<RKit<TestAtlas, readonly ["common"]>>().toBeObject();

    expectTypeOf<R$>().toBeObject();
    expectTypeOf<R$>().toHaveProperty("namespace");
    expectTypeOf<R$>().toHaveProperty("locale");
  });
});

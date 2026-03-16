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
  RMachineConfigParams,
} from "../../src/lib/index.js";
import { RMachine, type RMachineLocale } from "../../src/lib/index.js";

type TestAtlas = { readonly common: { greeting: string } };

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(RMachine.for<AnyResourceAtlas>().create).toBeFunction();

    expectTypeOf<RMachineLocale<RMachine<TestAtlas, "en" | "it">>>().toEqualTypeOf<"en" | "it">();

    expectTypeOf<RMachineConfig<string>>().toBeObject();

    expectTypeOf<RMachineConfigParams<readonly ["en", "it"]>>().toBeObject();

    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
    expectTypeOf<AnyR>().toEqualTypeOf<object>();
    expectTypeOf<AnyResourceAtlas>().toBeObject();
    expectTypeOf<Namespace<TestAtlas>>().toExtend<string>();
    expectTypeOf<R<{ greeting: string }>>().toExtend<{ greeting: string }>();

    expectTypeOf<AnyNamespaceList>().toExtend<readonly AnyNamespace[]>();
    expectTypeOf<AnyRKit>().toExtend<readonly AnyR[]>();
    expectTypeOf<NamespaceList<TestAtlas>>().toExtend<readonly string[]>();
    expectTypeOf<RKit<TestAtlas, readonly ["common"]>>().toBeObject();

    expectTypeOf<R$>().toBeObject();
  });
});

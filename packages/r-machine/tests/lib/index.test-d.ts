import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNamespace,
  AnyNamespaceList,
  AnyR,
  AnyResourceAtlas,
  AnyRList,
  Namespace,
  NamespaceList,
  RCtx,
  RList,
  RMachineConfig,
  RMachineConfigParams,
  RShape,
} from "../../src/lib/index.js";
import { ofType, RMachine, type RMachineLocale } from "../../src/lib/index.js";

type TestAtlas = { readonly common: { greeting: string } };

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(RMachine.create).toBeFunction();

    expectTypeOf<RMachineLocale<RMachine<AnyResourceAtlas, string, {}>>>().toBeString();

    expectTypeOf<RMachineConfig<AnyResourceAtlas, string, {}>>().toBeObject();

    expectTypeOf<RMachineConfigParams<AnyResourceAtlas, readonly ["en", "it"], {}>>().toBeObject();

    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
    expectTypeOf<AnyR>().toEqualTypeOf<any>();
    expectTypeOf<AnyResourceAtlas>().toBeObject();
    expectTypeOf<Namespace<TestAtlas>>().toExtend<string>();
    expectTypeOf<RShape<{ greeting: string }>>().toExtend<{ greeting: string }>();

    expectTypeOf<AnyNamespaceList>().toExtend<readonly AnyNamespace[]>();
    expectTypeOf<AnyRList>().toExtend<readonly AnyR[]>();
    expectTypeOf<NamespaceList<TestAtlas>>().toExtend<readonly string[]>();
    expectTypeOf<RList<TestAtlas, readonly ["common"]>>().toBeObject();

    expectTypeOf<RCtx<string, {}>>().toBeObject();

    expectTypeOf(ofType).toBeFunction();
  });
});

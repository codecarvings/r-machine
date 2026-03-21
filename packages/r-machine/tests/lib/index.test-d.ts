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
  RCtx,
  RKit,
  RMachineConfig,
  RMachineConfigParams,
} from "../../src/lib/index.js";
import {
  byLocale,
  RMachine,
  type RMachineBuilder,
  type RMachineLocale,
  type RMachineRCtx,
  type RMachineSetup,
} from "../../src/lib/index.js";

type TestAtlas = { readonly common: { greeting: string } };

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(byLocale).toBeFunction();
    expectTypeOf(RMachine.builder).toBeFunction();

    expectTypeOf<RMachineLocale<RMachine<TestAtlas, "en" | "it">>>().toEqualTypeOf<"en" | "it">();

    expectTypeOf<RMachineBuilder<readonly ["en", "it"]>>().toBeObject();
    expectTypeOf<RMachineSetup<readonly ["en", "it"], (locale: "en" | "it") => object>>().toBeObject();
    expectTypeOf<RMachineRCtx<RMachineBuilder<readonly ["en", "it"]>>>().toBeObject();

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

    expectTypeOf<RCtx>().toBeObject();
  });
});

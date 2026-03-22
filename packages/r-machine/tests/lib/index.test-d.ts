import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyFmtProvider,
  AnyNamespace,
  AnyNamespaceList,
  AnyR,
  AnyResourceAtlas,
  AnyRKit,
  EmptyFmtProvider,
  ExtractFmt,
  Namespace,
  NamespaceList,
  R,
  RCtx,
  RKit,
  RMachineConfig,
  RMachineConfigParams,
} from "../../src/lib/index.js";
import {
  EmptyFmtProviderCtor,
  FormattersSeed,
  RMachine,
  type RMachineLocale,
  type RMachineRCtx,
} from "../../src/lib/index.js";

type TestAtlas = { readonly common: { greeting: string } };

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("lib barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(RMachine.builder).toBeFunction();

    expectTypeOf<RMachineLocale<ReturnType<typeof RMachine.builder>>>().toBeString();

    expectTypeOf<RMachineRCtx<ReturnType<typeof RMachine.builder>>>().toBeObject();

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

    expectTypeOf<AnyFmtProvider>().toBeObject();

    expectTypeOf<EmptyFmtProvider>().toExtend<AnyFmtProvider>();

    expectTypeOf<ExtractFmt<EmptyFmtProvider>>().toEqualTypeOf<{}>();

    expectTypeOf(FormattersSeed.create).toBeFunction();

    expectTypeOf(EmptyFmtProviderCtor).toBeConstructibleWith();
    expectTypeOf(EmptyFmtProviderCtor.get).toBeFunction();
  });
});

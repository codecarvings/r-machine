import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyLocale,
  AnyLocaleList,
  AnyNamespace,
  AnyNamespaceList,
  AnyR,
  AnyResourceAtlas,
  AnyRKit,
  LocaleList,
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

describe("lib barrel exports", () => {
  it("exports RMachine as an object type with locale parameter", () => {
    expectTypeOf<RMachine<AnyResourceAtlas, string>>().toBeObject();
  });

  it("exports RMachine.for static builder", () => {
    const builder = RMachine.for<AnyResourceAtlas>();
    expectTypeOf(builder).toHaveProperty("create");
  });

  it("exports RMachineLocale utility type", () => {
    type Machine = RMachine<{ readonly common: { greeting: string } }, "en" | "it">;
    expectTypeOf<RMachineLocale<Machine>>().toEqualTypeOf<"en" | "it">();
  });

  it("exports RMachineConfig with locale parameter", () => {
    expectTypeOf<RMachineConfig<string>>().toBeObject();
    expectTypeOf<RMachineConfig<"en" | "it">["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
  });

  it("exports RMachineConfigParams with tuple parameter", () => {
    expectTypeOf<RMachineConfigParams<readonly ["en", "it"]>["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
  });

  it("exports locale types: AnyLocale, AnyLocaleList, LocaleList", () => {
    expectTypeOf<AnyLocale>().toEqualTypeOf<string>();
    expectTypeOf<AnyLocaleList>().toExtend<readonly AnyLocale[]>();
    expectTypeOf<LocaleList<"en" | "it">>().toExtend<readonly ("en" | "it")[]>();
  });

  it("exports resource types: AnyNamespace, AnyR, AnyResourceAtlas, Namespace, R", () => {
    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
    expectTypeOf<AnyR>().toEqualTypeOf<object>();
    expectTypeOf<AnyResourceAtlas>().toBeObject();
    expectTypeOf<Namespace<TestAtlas>>().toExtend<string>();
    expectTypeOf<R<{ greeting: string }>>().toExtend<{ greeting: string }>();
  });

  it("exports resource kit types: AnyNamespaceList, AnyRKit, NamespaceList, RKit", () => {
    expectTypeOf<AnyNamespaceList>().toExtend<readonly AnyNamespace[]>();
    expectTypeOf<AnyRKit>().toExtend<readonly AnyR[]>();
    expectTypeOf<NamespaceList<TestAtlas>>().toExtend<readonly string[]>();
    expectTypeOf<RKit<TestAtlas, readonly ["common"]>>().toBeObject();
  });

  it("exports R$ with namespace and locale properties", () => {
    expectTypeOf<R$>().toBeObject();
    expectTypeOf<R$>().toHaveProperty("namespace");
    expectTypeOf<R$>().toHaveProperty("locale");
  });
});

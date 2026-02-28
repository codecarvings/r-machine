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
  it("should export RMachine as a class", () => {
    expectTypeOf<RMachine<AnyResourceAtlas>>().toBeObject();
    expectTypeOf(RMachine).constructorParameters.toEqualTypeOf<[config: RMachineConfig]>();
  });

  it("should export RMachineConfig as an object type", () => {
    expectTypeOf<RMachineConfig>().toBeObject();
  });

  it("should export AnyNamespace as string", () => {
    expectTypeOf<AnyNamespace>().toEqualTypeOf<string>();
  });

  it("should export AnyR as object", () => {
    expectTypeOf<AnyR>().toEqualTypeOf<object>();
  });

  it("should export AnyResourceAtlas as an object type", () => {
    expectTypeOf<AnyResourceAtlas>().toBeObject();
  });

  it("should export Namespace as a string-extracting type", () => {
    type TestAtlas = { readonly common: { greeting: string } };
    expectTypeOf<Namespace<TestAtlas>>().toExtend<string>();
  });

  it("should export R as a type extractor", () => {
    type Resource = { greeting: string };
    expectTypeOf<R<Resource>>().toExtend<Resource>();
  });

  it("should export AnyNamespaceList as readonly array", () => {
    expectTypeOf<AnyNamespaceList>().toExtend<readonly AnyNamespace[]>();
  });

  it("should export AnyRKit as readonly array", () => {
    expectTypeOf<AnyRKit>().toExtend<readonly AnyR[]>();
  });

  it("should export NamespaceList as readonly array", () => {
    type TestAtlas = { readonly common: { greeting: string } };
    expectTypeOf<NamespaceList<TestAtlas>>().toExtend<readonly string[]>();
  });

  it("should export RKit as an object type", () => {
    type TestAtlas = { readonly common: { greeting: string } };
    expectTypeOf<RKit<TestAtlas, readonly ["common"]>>().toBeObject();
  });

  it("should export R$ as an interface", () => {
    expectTypeOf<R$>().toBeObject();
    expectTypeOf<R$>().toHaveProperty("namespace");
    expectTypeOf<R$>().toHaveProperty("locale");
  });
});

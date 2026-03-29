import { describe, expectTypeOf, it } from "vitest";
import type { AnyR } from "../../src/lib/r.js";
import type { AnyRFactory, AnyRForge, AnyRModule, RModuleResolver } from "../../src/lib/r-module.js";
import { resolveR, resolveRFromModule } from "../../src/lib/r-module.js";
import type { AnyNamespace } from "../../src/lib/resource-atlas.js";

describe("AnyRFactory", () => {
  it("should be a function type", () => {
    expectTypeOf<AnyRFactory>().toBeFunction();
  });

  it("should return AnyR or Promise<AnyR>", () => {
    expectTypeOf<AnyRFactory>().returns.toEqualTypeOf<AnyR | Promise<AnyR>>();
  });
});

describe("AnyRForge", () => {
  it("should be union of AnyR and AnyRFactory", () => {
    expectTypeOf<AnyRForge>().toEqualTypeOf<AnyR | AnyRFactory>();
  });

  it("object should be assignable to AnyRForge", () => {
    const forge: AnyRForge = { greeting: "Hello" };
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  it("sync factory should be assignable to AnyRForge", () => {
    const forge: AnyRForge = () => ({ greeting: "hi" });
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  it("async factory should be assignable to AnyRForge", () => {
    const forge: AnyRForge = async () => ({ greeting: "hi" });
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  it("AnyR should extend AnyRForge", () => {
    expectTypeOf<AnyR>().toExtend<AnyRForge>();
  });

  it("AnyRFactory should extend AnyRForge", () => {
    expectTypeOf<AnyRFactory>().toExtend<AnyRForge>();
  });
});

describe("AnyRModule", () => {
  it("should be an object type", () => {
    expectTypeOf<AnyRModule>().toBeObject();
  });

  it("should have readonly default property", () => {
    expectTypeOf<AnyRModule>().toHaveProperty("default");
  });

  it("default should be AnyRForge type", () => {
    expectTypeOf<AnyRModule["default"]>().toEqualTypeOf<AnyRForge>();
  });

  it("module with object default should be assignable", () => {
    const module: AnyRModule = { default: { greeting: "Hello" } };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  it("module with sync factory default should be assignable", () => {
    const module: AnyRModule = { default: () => ({ greeting: "hi" }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  it("module with async factory default should be assignable", () => {
    const module: AnyRModule = { default: async () => ({ greeting: "hi" }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });
});

describe("RModuleResolver", () => {
  it("should be a function type", () => {
    expectTypeOf<RModuleResolver>().toBeFunction();
  });

  it("should accept namespace as first parameter", () => {
    expectTypeOf<RModuleResolver>().parameter(0).toEqualTypeOf<AnyNamespace>();
  });

  it("should accept locale string as second parameter", () => {
    expectTypeOf<RModuleResolver>().parameter(1).toEqualTypeOf<string>();
  });

  it("should return Promise<AnyRModule>", () => {
    expectTypeOf<RModuleResolver>().returns.toEqualTypeOf<Promise<AnyRModule>>();
  });

  it("valid resolver should be assignable", () => {
    const resolver: RModuleResolver = async (namespace, locale) => ({
      default: { key: `${namespace}-${locale}` },
    });
    expectTypeOf(resolver).toExtend<RModuleResolver>();
  });
});

describe("resolveRFromModule", () => {
  it("should return Promise<AnyR>", () => {
    expectTypeOf(resolveRFromModule).returns.toEqualTypeOf<Promise<AnyR>>();
  });
});

describe("resolveR", () => {
  it("should accept RModuleResolver as first parameter", () => {
    expectTypeOf(resolveR).parameter(0).toEqualTypeOf<RModuleResolver>();
  });

  it("should accept AnyNamespace as second parameter", () => {
    expectTypeOf(resolveR).parameter(1).toEqualTypeOf<AnyNamespace>();
  });

  it("should accept locale string as third parameter", () => {
    expectTypeOf(resolveR).parameter(2).toEqualTypeOf<string>();
  });

  it("should return Promise<AnyR>", () => {
    expectTypeOf(resolveR).returns.toEqualTypeOf<Promise<AnyR>>();
  });
});

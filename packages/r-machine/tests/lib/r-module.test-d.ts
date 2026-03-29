import { describe, expectTypeOf, it } from "vitest";
import type { AnyR } from "../../src/lib/r.js";
import type { AnyRFactory, AnyRForge, AnyRModule, RModuleLoader } from "../../src/lib/r-module.js";
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

  it("should have readonly r property", () => {
    expectTypeOf<AnyRModule>().toHaveProperty("r");
  });

  it("r should be AnyRForge type", () => {
    expectTypeOf<AnyRModule["r"]>().toEqualTypeOf<AnyRForge>();
  });

  it("module with object r should be assignable", () => {
    const module: AnyRModule = { r: { greeting: "Hello" } };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  it("module with sync factory r should be assignable", () => {
    const module: AnyRModule = { r: () => ({ greeting: "hi" }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  it("module with async factory r should be assignable", () => {
    const module: AnyRModule = { r: async () => ({ greeting: "hi" }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });
});

describe("RModuleLoader", () => {
  it("should be a function type", () => {
    expectTypeOf<RModuleLoader>().toBeFunction();
  });

  it("should accept namespace as first parameter", () => {
    expectTypeOf<RModuleLoader>().parameter(0).toEqualTypeOf<AnyNamespace>();
  });

  it("should accept locale string as second parameter", () => {
    expectTypeOf<RModuleLoader>().parameter(1).toEqualTypeOf<string>();
  });

  it("should return Promise<AnyRModule>", () => {
    expectTypeOf<RModuleLoader>().returns.toEqualTypeOf<Promise<AnyRModule>>();
  });

  it("valid resolver should be assignable", () => {
    const resolver: RModuleLoader = async (namespace, locale) => ({
      r: { key: `${namespace}-${locale}` },
    });
    expectTypeOf(resolver).toExtend<RModuleLoader>();
  });
});

describe("resolveRFromModule", () => {
  it("should return Promise<AnyR>", () => {
    expectTypeOf(resolveRFromModule).returns.toEqualTypeOf<Promise<AnyR>>();
  });
});

describe("resolveR", () => {
  it("should accept RModuleLoader as first parameter", () => {
    expectTypeOf(resolveR).parameter(0).toEqualTypeOf<RModuleLoader>();
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

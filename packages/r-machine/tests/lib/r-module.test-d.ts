import { describe, expectTypeOf, it } from "vitest";
import type { AnyNamespace, AnyR } from "../../src/lib/r.js";
import type { AnyRFactory, AnyRForge, AnyRModule, RCtx, RModuleResolver } from "../../src/lib/r-module.js";
import { resolveR, resolveRFromModule } from "../../src/lib/r-module.js";

describe("RCtx", () => {
  it("should be an object type", () => {
    expectTypeOf<RCtx>().toBeObject();
  });

  it("should have readonly namespace property of type string", () => {
    expectTypeOf<RCtx>().toHaveProperty("namespace").toEqualTypeOf<string>();
  });

  it("should have readonly locale property of type string", () => {
    expectTypeOf<RCtx>().toHaveProperty("locale").toEqualTypeOf<string>();
  });

  it("should have readonly fmt property defaulting to undefined", () => {
    expectTypeOf<RCtx>().toHaveProperty("fmt").toEqualTypeOf<undefined>();
  });

  it("valid RCtx object should be assignable", () => {
    const r$: RCtx = { namespace: "common", locale: "en", fmt: undefined };
    expectTypeOf(r$).toExtend<RCtx>();
  });

  it("should have exactly three properties", () => {
    type RCtxKeys = keyof RCtx;
    expectTypeOf<RCtxKeys>().toEqualTypeOf<"namespace" | "locale" | "fmt">();
  });

  it("should accept generic parameters for locale and fmt", () => {
    type Narrow = RCtx<"en" | "it", { date: (d: Date) => string }>;
    expectTypeOf<Narrow>().toHaveProperty("locale").toEqualTypeOf<"en" | "it">();
    expectTypeOf<Narrow>().toHaveProperty("fmt").toEqualTypeOf<{ date: (d: Date) => string }>();
  });
});

describe("AnyRFactory", () => {
  it("should be a function type", () => {
    expectTypeOf<AnyRFactory>().toBeFunction();
  });

  it("should accept RCtx parameter", () => {
    expectTypeOf<AnyRFactory>().parameter(0).toEqualTypeOf<RCtx>();
  });

  it("should return AnyR or Promise<AnyR>", () => {
    expectTypeOf<AnyRFactory>().returns.toEqualTypeOf<AnyR | Promise<AnyR>>();
  });

  it("sync factory returning object should be assignable", () => {
    const syncFactory: AnyRFactory = ($: RCtx) => ({ greeting: `Hello from ${$.locale}` });
    expectTypeOf(syncFactory).toExtend<AnyRFactory>();
  });

  it("async factory returning object should be assignable", () => {
    const asyncFactory: AnyRFactory = async ($: RCtx) => ({ greeting: `Hello from ${$.locale}` });
    expectTypeOf(asyncFactory).toExtend<AnyRFactory>();
  });

  it("factory using namespace should be valid", () => {
    const factory: AnyRFactory = ($: RCtx) => ({ ns: $.namespace, loc: $.locale });
    expectTypeOf(factory).toExtend<AnyRFactory>();
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
    const forge: AnyRForge = ($: RCtx) => ({ greeting: $.locale });
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  it("async factory should be assignable to AnyRForge", () => {
    const forge: AnyRForge = async ($: RCtx) => ({ greeting: $.locale });
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
    const module: AnyRModule = { default: ($: RCtx) => ({ greeting: $.locale }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  it("module with async factory default should be assignable", () => {
    const module: AnyRModule = { default: async ($: RCtx) => ({ greeting: $.locale }) };
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

  it("resolver returning factory module should be valid", () => {
    const resolver: RModuleResolver = async (_namespace, _locale) => ({
      default: ($: RCtx) => ({ greeting: $.locale }),
    });
    expectTypeOf(resolver).toExtend<RModuleResolver>();
  });
});

describe("resolveRFromModule", () => {
  it("should be a function", () => {
    expectTypeOf(resolveRFromModule).toBeFunction();
  });

  it("should accept AnyRModule as first parameter", () => {
    expectTypeOf(resolveRFromModule).parameter(0).toEqualTypeOf<AnyRModule>();
  });

  it("should accept RCtx as second parameter", () => {
    expectTypeOf(resolveRFromModule).parameter(1).toEqualTypeOf<RCtx>();
  });

  it("should return Promise<AnyR>", () => {
    expectTypeOf(resolveRFromModule).returns.toEqualTypeOf<Promise<AnyR>>();
  });

  it("should have correct function signature", () => {
    expectTypeOf(resolveRFromModule).toEqualTypeOf<(rModule: AnyRModule, $: RCtx) => Promise<AnyR>>();
  });
});

describe("resolveR", () => {
  it("should be a function", () => {
    expectTypeOf(resolveR).toBeFunction();
  });

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

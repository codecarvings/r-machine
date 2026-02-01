import { describe, expectTypeOf, test } from "vitest";
import type { AnyNamespace, AnyR } from "./r.js";
import type { AnyRFactory, AnyRForge, AnyRModule, R$, RModuleResolver } from "./r-module.js";
import { resolveR, resolveRFromModule } from "./r-module.js";

describe("R$", () => {
  test("should be an object type", () => {
    expectTypeOf<R$>().toBeObject();
  });

  test("should have readonly namespace property of type string", () => {
    expectTypeOf<R$>().toHaveProperty("namespace").toEqualTypeOf<string>();
  });

  test("should have readonly locale property of type string", () => {
    expectTypeOf<R$>().toHaveProperty("locale").toEqualTypeOf<string>();
  });

  test("valid R$ object should be assignable", () => {
    const r$: R$ = { namespace: "common", locale: "en" };
    expectTypeOf(r$).toExtend<R$>();
  });

  test("should have exactly two properties", () => {
    type R$Keys = keyof R$;
    expectTypeOf<R$Keys>().toEqualTypeOf<"namespace" | "locale">();
  });
});

describe("AnyRFactory", () => {
  test("should be a function type", () => {
    expectTypeOf<AnyRFactory>().toBeFunction();
  });

  test("should accept R$ parameter", () => {
    expectTypeOf<AnyRFactory>().parameter(0).toEqualTypeOf<R$>();
  });

  test("should return AnyR or Promise<AnyR>", () => {
    expectTypeOf<AnyRFactory>().returns.toEqualTypeOf<AnyR | Promise<AnyR>>();
  });

  test("sync factory returning object should be assignable", () => {
    const syncFactory: AnyRFactory = ($: R$) => ({ greeting: `Hello from ${$.locale}` });
    expectTypeOf(syncFactory).toExtend<AnyRFactory>();
  });

  test("async factory returning object should be assignable", () => {
    const asyncFactory: AnyRFactory = async ($: R$) => ({ greeting: `Hello from ${$.locale}` });
    expectTypeOf(asyncFactory).toExtend<AnyRFactory>();
  });

  test("factory using namespace should be valid", () => {
    const factory: AnyRFactory = ($: R$) => ({ ns: $.namespace, loc: $.locale });
    expectTypeOf(factory).toExtend<AnyRFactory>();
  });
});

describe("AnyRForge", () => {
  test("should be union of AnyR and AnyRFactory", () => {
    expectTypeOf<AnyRForge>().toEqualTypeOf<AnyR | AnyRFactory>();
  });

  test("object should be assignable to AnyRForge", () => {
    const forge: AnyRForge = { greeting: "Hello" };
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  test("sync factory should be assignable to AnyRForge", () => {
    const forge: AnyRForge = ($: R$) => ({ greeting: $.locale });
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  test("async factory should be assignable to AnyRForge", () => {
    const forge: AnyRForge = async ($: R$) => ({ greeting: $.locale });
    expectTypeOf(forge).toExtend<AnyRForge>();
  });

  test("AnyR should extend AnyRForge", () => {
    expectTypeOf<AnyR>().toExtend<AnyRForge>();
  });

  test("AnyRFactory should extend AnyRForge", () => {
    expectTypeOf<AnyRFactory>().toExtend<AnyRForge>();
  });
});

describe("AnyRModule", () => {
  test("should be an object type", () => {
    expectTypeOf<AnyRModule>().toBeObject();
  });

  test("should have readonly default property", () => {
    expectTypeOf<AnyRModule>().toHaveProperty("default");
  });

  test("default should be AnyRForge type", () => {
    expectTypeOf<AnyRModule["default"]>().toEqualTypeOf<AnyRForge>();
  });

  test("module with object default should be assignable", () => {
    const module: AnyRModule = { default: { greeting: "Hello" } };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  test("module with sync factory default should be assignable", () => {
    const module: AnyRModule = { default: ($: R$) => ({ greeting: $.locale }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });

  test("module with async factory default should be assignable", () => {
    const module: AnyRModule = { default: async ($: R$) => ({ greeting: $.locale }) };
    expectTypeOf(module).toExtend<AnyRModule>();
  });
});

describe("RModuleResolver", () => {
  test("should be a function type", () => {
    expectTypeOf<RModuleResolver>().toBeFunction();
  });

  test("should accept namespace as first parameter", () => {
    expectTypeOf<RModuleResolver>().parameter(0).toEqualTypeOf<AnyNamespace>();
  });

  test("should accept locale string as second parameter", () => {
    expectTypeOf<RModuleResolver>().parameter(1).toEqualTypeOf<string>();
  });

  test("should return Promise<AnyRModule>", () => {
    expectTypeOf<RModuleResolver>().returns.toEqualTypeOf<Promise<AnyRModule>>();
  });

  test("valid resolver should be assignable", () => {
    const resolver: RModuleResolver = async (namespace, locale) => ({
      default: { key: `${namespace}-${locale}` },
    });
    expectTypeOf(resolver).toExtend<RModuleResolver>();
  });

  test("resolver returning factory module should be valid", () => {
    const resolver: RModuleResolver = async (_namespace, _locale) => ({
      default: ($: R$) => ({ greeting: $.locale }),
    });
    expectTypeOf(resolver).toExtend<RModuleResolver>();
  });
});

describe("resolveRFromModule", () => {
  test("should be a function", () => {
    expectTypeOf(resolveRFromModule).toBeFunction();
  });

  test("should accept AnyRModule as first parameter", () => {
    expectTypeOf(resolveRFromModule).parameter(0).toEqualTypeOf<AnyRModule>();
  });

  test("should accept R$ as second parameter", () => {
    expectTypeOf(resolveRFromModule).parameter(1).toEqualTypeOf<R$>();
  });

  test("should return Promise<AnyR>", () => {
    expectTypeOf(resolveRFromModule).returns.toEqualTypeOf<Promise<AnyR>>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(resolveRFromModule).toEqualTypeOf<(rModule: AnyRModule, $: R$) => Promise<AnyR>>();
  });
});

describe("resolveR", () => {
  test("should be a function", () => {
    expectTypeOf(resolveR).toBeFunction();
  });

  test("should accept RModuleResolver as first parameter", () => {
    expectTypeOf(resolveR).parameter(0).toEqualTypeOf<RModuleResolver>();
  });

  test("should accept AnyNamespace as second parameter", () => {
    expectTypeOf(resolveR).parameter(1).toEqualTypeOf<AnyNamespace>();
  });

  test("should accept locale string as third parameter", () => {
    expectTypeOf(resolveR).parameter(2).toEqualTypeOf<string>();
  });

  test("should return Promise<AnyR>", () => {
    expectTypeOf(resolveR).returns.toEqualTypeOf<Promise<AnyR>>();
  });

  test("should have correct function signature", () => {
    expectTypeOf(resolveR).toEqualTypeOf<
      (rModuleResolver: RModuleResolver, namespace: AnyNamespace, locale: string) => Promise<AnyR>
    >();
  });
});

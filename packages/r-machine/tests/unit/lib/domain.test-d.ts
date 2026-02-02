import { describe, expectTypeOf, test } from "vitest";

import { Domain } from "../../../src/lib/domain.js";
import type { AnyR } from "../../../src/lib/r.js";
import type { AnyNamespaceList, AnyRKit } from "../../../src/lib/r-kit.js";
import type { RModuleResolver } from "../../../src/lib/r-module.js";

describe("Domain", () => {
  test("should be a class", () => {
    expectTypeOf(Domain).toBeConstructibleWith("en", (() => Promise.resolve({ default: {} })) as RModuleResolver);
  });

  test("should not be constructible without arguments", () => {
    expectTypeOf(Domain).constructorParameters.toEqualTypeOf<[locale: string, rModuleResolver: RModuleResolver]>();
  });

  describe("locale", () => {
    test("should be a readonly string property", () => {
      expectTypeOf<Domain>().toHaveProperty("locale").toEqualTypeOf<string>();
    });
  });

  describe("hybridPickR", () => {
    test("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickR").toBeFunction();
    });

    test("should accept a string namespace parameter", () => {
      expectTypeOf<Domain["hybridPickR"]>().parameter(0).toBeString();
    });

    test("should return AnyR | Promise<AnyR>", () => {
      expectTypeOf<Domain["hybridPickR"]>().returns.toEqualTypeOf<AnyR | Promise<AnyR>>();
    });

    test("return type should include synchronous AnyR", () => {
      expectTypeOf<AnyR>().toExtend<ReturnType<Domain["hybridPickR"]>>();
    });

    test("return type should include Promise<AnyR>", () => {
      expectTypeOf<Promise<AnyR>>().toExtend<ReturnType<Domain["hybridPickR"]>>();
    });
  });

  describe("pickR", () => {
    test("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("pickR").toBeFunction();
    });

    test("should accept a string namespace parameter", () => {
      expectTypeOf<Domain["pickR"]>().parameter(0).toBeString();
    });

    test("should return Promise<AnyR>", () => {
      expectTypeOf<Domain["pickR"]>().returns.toEqualTypeOf<Promise<AnyR>>();
    });

    test("return type should not include synchronous AnyR", () => {
      expectTypeOf<ReturnType<Domain["pickR"]>>().toExtend<Promise<AnyR>>();
    });
  });

  describe("hybridPickRKit", () => {
    test("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickRKit").toBeFunction();
    });

    test("should accept AnyNamespaceList parameter", () => {
      expectTypeOf<Domain["hybridPickRKit"]>().parameter(0).toEqualTypeOf<AnyNamespaceList>();
    });

    test("should return AnyRKit | Promise<AnyRKit>", () => {
      expectTypeOf<Domain["hybridPickRKit"]>().returns.toEqualTypeOf<AnyRKit | Promise<AnyRKit>>();
    });

    test("return type should include synchronous AnyRKit", () => {
      expectTypeOf<AnyRKit>().toExtend<ReturnType<Domain["hybridPickRKit"]>>();
    });

    test("return type should include Promise<AnyRKit>", () => {
      expectTypeOf<Promise<AnyRKit>>().toExtend<ReturnType<Domain["hybridPickRKit"]>>();
    });
  });

  describe("pickRKit", () => {
    test("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("pickRKit").toBeFunction();
    });

    test("should accept AnyNamespaceList parameter", () => {
      expectTypeOf<Domain["pickRKit"]>().parameter(0).toEqualTypeOf<AnyNamespaceList>();
    });

    test("should return Promise<AnyRKit>", () => {
      expectTypeOf<Domain["pickRKit"]>().returns.toEqualTypeOf<Promise<AnyRKit>>();
    });

    test("return type should not include synchronous AnyRKit", () => {
      expectTypeOf<ReturnType<Domain["pickRKit"]>>().toExtend<Promise<AnyRKit>>();
    });
  });

  describe("protected members are not publicly accessible", () => {
    test("should not expose rModuleResolver", () => {
      expectTypeOf<Domain>().not.toHaveProperty("rModuleResolver");
    });

    test("should not expose resources", () => {
      expectTypeOf<Domain>().not.toHaveProperty("resources");
    });

    test("should not expose pendingRKits", () => {
      expectTypeOf<Domain>().not.toHaveProperty("pendingRKits");
    });

    test("should not expose resolveR", () => {
      expectTypeOf<Domain>().not.toHaveProperty("resolveR");
    });

    test("should not expose resolveRKit", () => {
      expectTypeOf<Domain>().not.toHaveProperty("resolveRKit");
    });
  });

  describe("public API surface", () => {
    test("should have locale property", () => {
      expectTypeOf<Domain>().toHaveProperty("locale");
    });

    test("should have hybridPickR method", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickR");
    });

    test("should have pickR method", () => {
      expectTypeOf<Domain>().toHaveProperty("pickR");
    });

    test("should have hybridPickRKit method", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickRKit");
    });

    test("should have pickRKit method", () => {
      expectTypeOf<Domain>().toHaveProperty("pickRKit");
    });
  });

  describe("parameter compatibility", () => {
    test("hybridPickR and pickR accept the same parameter type", () => {
      expectTypeOf<Domain["hybridPickR"]>().parameter(0).toEqualTypeOf<Parameters<Domain["pickR"]>[0]>();
    });

    test("hybridPickRKit and pickRKit accept the same parameter type", () => {
      expectTypeOf<Domain["hybridPickRKit"]>().parameter(0).toEqualTypeOf<Parameters<Domain["pickRKit"]>[0]>();
    });

    test("pickR return type extends hybridPickR return type", () => {
      expectTypeOf<ReturnType<Domain["pickR"]>>().toExtend<ReturnType<Domain["hybridPickR"]>>();
    });

    test("pickRKit return type extends hybridPickRKit return type", () => {
      expectTypeOf<ReturnType<Domain["pickRKit"]>>().toExtend<ReturnType<Domain["hybridPickRKit"]>>();
    });

    test("namespace list methods accept readonly arrays", () => {
      const namespaces = ["common", "home"] as const;
      expectTypeOf(namespaces).toExtend<Parameters<Domain["hybridPickRKit"]>[0]>();
      expectTypeOf(namespaces).toExtend<Parameters<Domain["pickRKit"]>[0]>();
    });

    test("namespace list methods accept mutable arrays", () => {
      const namespaces: string[] = ["common", "home"];
      expectTypeOf(namespaces).toExtend<Parameters<Domain["hybridPickRKit"]>[0]>();
      expectTypeOf(namespaces).toExtend<Parameters<Domain["pickRKit"]>[0]>();
    });
  });
});

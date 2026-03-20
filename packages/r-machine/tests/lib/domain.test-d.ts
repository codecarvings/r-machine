import { describe, expectTypeOf, it } from "vitest";

import { Domain } from "../../src/lib/domain.js";
import type { AnyR } from "../../src/lib/r.js";
import type { AnyNamespaceList, AnyRKit } from "../../src/lib/r-kit.js";
import type { RModuleResolver } from "../../src/lib/r-module.js";

describe("Domain", () => {
  it("should be a class", () => {
    expectTypeOf(Domain).toBeConstructibleWith("en", (() => Promise.resolve({ default: {} })) as RModuleResolver);
  });

  it("should not be constructible without arguments", () => {
    expectTypeOf(Domain).constructorParameters.toEqualTypeOf<
      [locale: string, rModuleResolver: RModuleResolver, formatters?: ((locale: string) => object) | undefined]
    >();
  });

  describe("locale", () => {
    it("should be a readonly string property", () => {
      expectTypeOf<Domain>().toHaveProperty("locale").toEqualTypeOf<string>();
    });
  });

  describe("hybridPickR", () => {
    it("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickR").toBeFunction();
    });

    it("should accept a string namespace parameter", () => {
      expectTypeOf<Domain["hybridPickR"]>().parameter(0).toBeString();
    });

    it("should return AnyR | Promise<AnyR>", () => {
      expectTypeOf<Domain["hybridPickR"]>().returns.toEqualTypeOf<AnyR | Promise<AnyR>>();
    });

    it("return type should include synchronous AnyR", () => {
      expectTypeOf<AnyR>().toExtend<ReturnType<Domain["hybridPickR"]>>();
    });

    it("return type should include Promise<AnyR>", () => {
      expectTypeOf<Promise<AnyR>>().toExtend<ReturnType<Domain["hybridPickR"]>>();
    });
  });

  describe("pickR", () => {
    it("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("pickR").toBeFunction();
    });

    it("should accept a string namespace parameter", () => {
      expectTypeOf<Domain["pickR"]>().parameter(0).toBeString();
    });

    it("should return Promise<AnyR>", () => {
      expectTypeOf<Domain["pickR"]>().returns.toEqualTypeOf<Promise<AnyR>>();
    });

    it("return type should not include synchronous AnyR", () => {
      expectTypeOf<ReturnType<Domain["pickR"]>>().toExtend<Promise<AnyR>>();
    });
  });

  describe("hybridPickRKit", () => {
    it("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickRKit").toBeFunction();
    });

    it("should accept AnyNamespaceList parameter", () => {
      expectTypeOf<Domain["hybridPickRKit"]>().parameter(0).toEqualTypeOf<AnyNamespaceList>();
    });

    it("should return AnyRKit | Promise<AnyRKit>", () => {
      expectTypeOf<Domain["hybridPickRKit"]>().returns.toEqualTypeOf<AnyRKit | Promise<AnyRKit>>();
    });

    it("return type should include synchronous AnyRKit", () => {
      expectTypeOf<AnyRKit>().toExtend<ReturnType<Domain["hybridPickRKit"]>>();
    });

    it("return type should include Promise<AnyRKit>", () => {
      expectTypeOf<Promise<AnyRKit>>().toExtend<ReturnType<Domain["hybridPickRKit"]>>();
    });
  });

  describe("pickRKit", () => {
    it("should be a method on Domain", () => {
      expectTypeOf<Domain>().toHaveProperty("pickRKit").toBeFunction();
    });

    it("should accept AnyNamespaceList parameter", () => {
      expectTypeOf<Domain["pickRKit"]>().parameter(0).toEqualTypeOf<AnyNamespaceList>();
    });

    it("should return Promise<AnyRKit>", () => {
      expectTypeOf<Domain["pickRKit"]>().returns.toEqualTypeOf<Promise<AnyRKit>>();
    });

    it("return type should not include synchronous AnyRKit", () => {
      expectTypeOf<ReturnType<Domain["pickRKit"]>>().toExtend<Promise<AnyRKit>>();
    });
  });

  describe("protected members are not publicly accessible", () => {
    it("should not expose rModuleResolver", () => {
      expectTypeOf<Domain>().not.toHaveProperty("rModuleResolver");
    });

    it("should not expose resources", () => {
      expectTypeOf<Domain>().not.toHaveProperty("resources");
    });

    it("should not expose pendingRKits", () => {
      expectTypeOf<Domain>().not.toHaveProperty("pendingRKits");
    });

    it("should not expose resolveR", () => {
      expectTypeOf<Domain>().not.toHaveProperty("resolveR");
    });

    it("should not expose resolveRKit", () => {
      expectTypeOf<Domain>().not.toHaveProperty("resolveRKit");
    });
  });

  describe("public API surface", () => {
    it("should have locale property", () => {
      expectTypeOf<Domain>().toHaveProperty("locale");
    });

    it("should have hybridPickR method", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickR");
    });

    it("should have pickR method", () => {
      expectTypeOf<Domain>().toHaveProperty("pickR");
    });

    it("should have hybridPickRKit method", () => {
      expectTypeOf<Domain>().toHaveProperty("hybridPickRKit");
    });

    it("should have pickRKit method", () => {
      expectTypeOf<Domain>().toHaveProperty("pickRKit");
    });
  });

  describe("parameter compatibility", () => {
    it("hybridPickR and pickR accept the same parameter type", () => {
      expectTypeOf<Domain["hybridPickR"]>().parameter(0).toEqualTypeOf<Parameters<Domain["pickR"]>[0]>();
    });

    it("hybridPickRKit and pickRKit accept the same parameter type", () => {
      expectTypeOf<Domain["hybridPickRKit"]>().parameter(0).toEqualTypeOf<Parameters<Domain["pickRKit"]>[0]>();
    });

    it("pickR return type extends hybridPickR return type", () => {
      expectTypeOf<ReturnType<Domain["pickR"]>>().toExtend<ReturnType<Domain["hybridPickR"]>>();
    });

    it("pickRKit return type extends hybridPickRKit return type", () => {
      expectTypeOf<ReturnType<Domain["pickRKit"]>>().toExtend<ReturnType<Domain["hybridPickRKit"]>>();
    });

    it("namespace list methods accept readonly arrays", () => {
      const namespaces = ["common", "home"] as const;
      expectTypeOf(namespaces).toExtend<Parameters<Domain["hybridPickRKit"]>[0]>();
      expectTypeOf(namespaces).toExtend<Parameters<Domain["pickRKit"]>[0]>();
    });

    it("namespace list methods accept mutable arrays", () => {
      const namespaces: string[] = ["common", "home"];
      expectTypeOf(namespaces).toExtend<Parameters<Domain["hybridPickRKit"]>[0]>();
      expectTypeOf(namespaces).toExtend<Parameters<Domain["pickRKit"]>[0]>();
    });
  });
});

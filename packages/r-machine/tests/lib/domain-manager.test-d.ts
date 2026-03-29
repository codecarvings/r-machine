import { describe, expectTypeOf, it } from "vitest";

import type { Domain } from "../../src/lib/domain.js";
import { DomainManager } from "../../src/lib/domain-manager.js";
import type { RModuleLoader } from "../../src/lib/r-module.js";

describe("DomainManager", () => {
  it("should be a class", () => {
    expectTypeOf(DomainManager).toBeConstructibleWith((() => Promise.resolve({ r: {} })) as RModuleLoader);
  });

  it("constructor should require an RModuleLoader parameter", () => {
    expectTypeOf(DomainManager).constructorParameters.toEqualTypeOf<[loadModule: RModuleLoader]>();
  });

  describe("getDomain", () => {
    it("should accept a string locale parameter", () => {
      expectTypeOf<DomainManager["getDomain"]>().parameter(0).toBeString();
    });

    it("should return a Domain instance type", () => {
      expectTypeOf<DomainManager["getDomain"]>().returns.toEqualTypeOf<Domain>();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<DomainManager["getDomain"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("protected members are not publicly accessible", () => {
    it("should not expose loadModule", () => {
      expectTypeOf<DomainManager>().not.toHaveProperty("loadModule");
    });

    it("should not expose cache", () => {
      expectTypeOf<DomainManager>().not.toHaveProperty("cache");
    });
  });
});

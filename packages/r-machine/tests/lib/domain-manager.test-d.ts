import { describe, expectTypeOf, it } from "vitest";

import type { Domain } from "../../src/lib/domain.js";
import { DomainManager } from "../../src/lib/domain-manager.js";
import type { AnyFmtGetter } from "../../src/lib/fmt.js";
import type { RModuleResolver } from "../../src/lib/r-module.js";

describe("DomainManager", () => {
  it("should be a class", () => {
    expectTypeOf(DomainManager).toBeConstructibleWith(
      (() => Promise.resolve({ default: {} })) as RModuleResolver,
      (() => ({})) as AnyFmtGetter
    );
  });

  it("constructor should require an RModuleResolver and formatters parameters", () => {
    expectTypeOf(DomainManager).constructorParameters.toEqualTypeOf<
      [rModuleResolver: RModuleResolver, formatters: AnyFmtGetter]
    >();
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
    it("should not expose rModuleResolver", () => {
      expectTypeOf<DomainManager>().not.toHaveProperty("rModuleResolver");
    });

    it("should not expose cache", () => {
      expectTypeOf<DomainManager>().not.toHaveProperty("cache");
    });

    it("should not expose formatters", () => {
      expectTypeOf<DomainManager>().not.toHaveProperty("formatters");
    });
  });
});

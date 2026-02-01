import { describe, expect, test, vi } from "vitest";
import { RMachineError } from "#r-machine/errors";
import type { AnyRModule, R$, RModuleResolver } from "./r-module.js";
import { resolveR, resolveRFromModule } from "./r-module.js";

function make$(overrides: Partial<R$> = {}): R$ {
  return { namespace: "common", locale: "en", ...overrides };
}

describe("resolveRFromModule", () => {
  describe("with a static object default export", () => {
    test("should resolve when default is a plain object", async () => {
      const r = { greeting: "Hello" };
      const result = await resolveRFromModule({ default: r }, make$());
      expect(result).toBe(r);
    });

    test("should resolve with the exact same object reference", async () => {
      const r = { a: 1, b: 2 };
      const result = await resolveRFromModule({ default: r }, make$());
      expect(result).toBe(r);
    });

    test("should resolve when default is an empty object", async () => {
      const r = {};
      const result = await resolveRFromModule({ default: r }, make$());
      expect(result).toBe(r);
    });

    test("should resolve when default is an array", async () => {
      const r = ["hello", "world"];
      const result = await resolveRFromModule({ default: r as any }, make$());
      expect(result).toBe(r);
    });
  });

  describe("with a sync factory default export", () => {
    test("should resolve with the object returned by the factory", async () => {
      const r = { greeting: "Ciao" };
      const module: AnyRModule = { default: () => r };
      const result = await resolveRFromModule(module, make$());
      expect(result).toBe(r);
    });

    test("should pass R$ to the factory", async () => {
      const factory = vi.fn(() => ({ key: "value" }));
      const $ = make$({ namespace: "auth", locale: "it" });
      await resolveRFromModule({ default: factory }, $);
      expect(factory).toHaveBeenCalledWith($);
    });

    test("should pass namespace and locale correctly", async () => {
      const module: AnyRModule = {
        default: ($: R$) => ({ ns: $.namespace, loc: $.locale }),
      };
      const result = await resolveRFromModule(module, make$({ namespace: "nav", locale: "de" }));
      expect(result).toEqual({ ns: "nav", loc: "de" });
    });

    test("should reject when factory returns null", async () => {
      const module: AnyRModule = { default: () => null as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("resource returned by factory is null");
    });

    test("should reject when factory returns undefined", async () => {
      const module: AnyRModule = { default: () => undefined as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("invalid resource type returned by factory");
    });

    test("should reject when factory returns a string", async () => {
      const module: AnyRModule = { default: () => "not an object" as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(
        "invalid resource type returned by factory (string)"
      );
    });

    test("should reject when factory returns a number", async () => {
      const module: AnyRModule = { default: () => 42 as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(
        "invalid resource type returned by factory (number)"
      );
    });
  });

  describe("with an async factory default export", () => {
    test("should resolve with the object returned by the async factory", async () => {
      const r = { greeting: "Hola" };
      const module: AnyRModule = { default: async () => r };
      const result = await resolveRFromModule(module, make$());
      expect(result).toBe(r);
    });

    test("should pass R$ to the async factory", async () => {
      const factory = vi.fn(async () => ({ key: "value" }));
      const $ = make$({ namespace: "footer", locale: "fr" });
      await resolveRFromModule({ default: factory }, $);
      expect(factory).toHaveBeenCalledWith($);
    });

    test("should reject when async factory resolves to null", async () => {
      const module: AnyRModule = { default: async () => null as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("resource returned by factory is null");
    });

    test("should reject when async factory resolves to a primitive", async () => {
      const module: AnyRModule = { default: async () => "bad" as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(
        "invalid resource type returned by factory (string)"
      );
    });

    test("should reject when async factory rejects", async () => {
      const innerError = new Error("network failure");
      const module: AnyRModule = {
        default: async () => {
          throw innerError;
        },
      };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("factory promise rejected");
    });
  });

  describe("with invalid module or default export", () => {
    test("should reject when module is null", async () => {
      await expect(resolveRFromModule(null as any, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(null as any, make$())).rejects.toThrow("module is not an object");
    });

    test("should reject when module is undefined", async () => {
      await expect(resolveRFromModule(undefined as any, make$())).rejects.toThrow("module is not an object");
    });

    test("should reject when module is a string", async () => {
      await expect(resolveRFromModule("bad" as any, make$())).rejects.toThrow("module is not an object");
    });

    test("should reject when module is a number", async () => {
      await expect(resolveRFromModule(42 as any, make$())).rejects.toThrow("module is not an object");
    });

    test("should reject when default export is null", async () => {
      const module = { default: null } as any;
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("exported resource is null");
    });

    test("should reject when default export is a string", async () => {
      const module = { default: "not valid" } as any;
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("invalid export type (string)");
    });

    test("should reject when default export is a number", async () => {
      const module = { default: 123 } as any;
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("invalid export type (number)");
    });

    test("should reject when default export is a boolean", async () => {
      const module = { default: true } as any;
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("invalid export type (boolean)");
    });

    test("should reject when default export is undefined", async () => {
      const module = { default: undefined } as any;
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("invalid export type (undefined)");
    });
  });

  describe("error messages", () => {
    test("should include namespace in error message", async () => {
      await expect(resolveRFromModule(null as any, make$({ namespace: "settings" }))).rejects.toThrow('"settings"');
    });

    test("should include locale in error message", async () => {
      await expect(resolveRFromModule(null as any, make$({ locale: "ja" }))).rejects.toThrow('"ja"');
    });

    test("rejected errors should be RMachineError instances", async () => {
      try {
        await resolveRFromModule(null as any, make$());
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});

describe("resolveR", () => {
  function makeResolver(moduleOrFactory: AnyRModule | (() => Promise<AnyRModule>)): RModuleResolver {
    if (typeof moduleOrFactory === "function") {
      return async () => moduleOrFactory();
    }
    return async () => moduleOrFactory;
  }

  describe("with a static module", () => {
    test("should resolve the resource from a static default export", async () => {
      const r = { hello: "world" };
      const resolver = makeResolver({ default: r });
      const result = await resolveR(resolver, "common", "en");
      expect(result).toBe(r);
    });

    test("should resolve the resource from a factory default export", async () => {
      const r = { greeting: "Hi" };
      const resolver = makeResolver({ default: () => r });
      const result = await resolveR(resolver, "common", "en");
      expect(result).toBe(r);
    });

    test("should resolve the resource from an async factory default export", async () => {
      const r = { greeting: "Bonjour" };
      const resolver = makeResolver({ default: async () => r });
      const result = await resolveR(resolver, "common", "fr");
      expect(result).toBe(r);
    });
  });

  describe("passes correct arguments", () => {
    test("should pass namespace and locale to the resolver", async () => {
      const resolver = vi.fn(async () => ({ default: { key: "val" } }));
      await resolveR(resolver, "auth", "de");
      expect(resolver).toHaveBeenCalledWith("auth", "de");
    });

    test("should pass R$ with correct namespace and locale to factory", async () => {
      const factory = vi.fn(($: R$) => ({ ns: $.namespace, loc: $.locale }));
      const resolver: RModuleResolver = async () => ({ default: factory });
      const result = await resolveR(resolver, "nav", "it");
      expect(factory).toHaveBeenCalledWith({ namespace: "nav", locale: "it" });
      expect(result).toEqual({ ns: "nav", loc: "it" });
    });
  });

  describe("resolver failure", () => {
    test("should reject when the resolver rejects", async () => {
      const resolver: RModuleResolver = async () => {
        throw new Error("import failed");
      };
      await expect(resolveR(resolver, "missing", "en")).rejects.toThrow(RMachineError);
      await expect(resolveR(resolver, "missing", "en")).rejects.toThrow("rModuleResolver failed");
    });

    test("should include namespace in resolver error", async () => {
      const resolver: RModuleResolver = async () => {
        throw new Error("fail");
      };
      await expect(resolveR(resolver, "dashboard", "en")).rejects.toThrow('"dashboard"');
    });

    test("should include locale in resolver error", async () => {
      const resolver: RModuleResolver = async () => {
        throw new Error("fail");
      };
      await expect(resolveR(resolver, "common", "zh")).rejects.toThrow('"zh"');
    });
  });

  describe("module resolution failure (propagated from resolveRFromModule)", () => {
    test("should reject when resolved module has null default", async () => {
      const resolver = makeResolver({ default: null } as any);
      await expect(resolveR(resolver, "common", "en")).rejects.toThrow("exported resource is null");
    });

    test("should reject when resolved module has invalid default type", async () => {
      const resolver = makeResolver({ default: "bad" } as any);
      await expect(resolveR(resolver, "common", "en")).rejects.toThrow("invalid export type (string)");
    });

    test("should reject when factory in resolved module returns null", async () => {
      const resolver = makeResolver({ default: () => null as any });
      await expect(resolveR(resolver, "common", "en")).rejects.toThrow("resource returned by factory is null");
    });

    test("should reject when async factory in resolved module rejects", async () => {
      const resolver = makeResolver({
        default: async () => {
          throw new Error("async fail");
        },
      });
      await expect(resolveR(resolver, "common", "en")).rejects.toThrow("factory promise rejected");
    });
  });
});

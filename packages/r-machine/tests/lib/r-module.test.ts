import { describe, expect, it, vi } from "vitest";
import { RMachineError } from "#r-machine/errors";
import type { AnyFmtGetter } from "../../src/lib/fmt.js";
import type { AnyRModule, RCtx, RModuleResolver } from "../../src/lib/r-module.js";
import { resolveR, resolveRFromModule } from "../../src/lib/r-module.js";

const noFmt: AnyFmtGetter = () => undefined;

function make$(overrides: Partial<RCtx> = {}): RCtx {
  return { namespace: "common", locale: "en", fmt: undefined, ...overrides };
}

describe("resolveRFromModule", () => {
  describe("with a static object default export", () => {
    it("should resolve when default is a plain object", async () => {
      const r = { greeting: "Hello" };
      const result = await resolveRFromModule({ default: r }, make$());
      expect(result).toBe(r);
    });
  });

  describe("with a sync factory default export", () => {
    it("should resolve with the object returned by the factory", async () => {
      const r = { greeting: "Ciao" };
      const module: AnyRModule = { default: () => r };
      const result = await resolveRFromModule(module, make$());
      expect(result).toBe(r);
    });

    it("should pass RCtx to the factory", async () => {
      const factory = vi.fn(() => ({ key: "value" }));
      const $ = make$({ namespace: "auth", locale: "it" });
      await resolveRFromModule({ default: factory }, $);
      expect(factory).toHaveBeenCalledWith($);
    });

    it("should pass namespace and locale correctly", async () => {
      const module: AnyRModule = {
        default: ($: RCtx) => ({ ns: $.namespace, loc: $.locale }),
      };
      const result = await resolveRFromModule(module, make$({ namespace: "nav", locale: "de" }));
      expect(result).toEqual({ ns: "nav", loc: "de" });
    });

    it("should reject when factory returns null", async () => {
      const module: AnyRModule = { default: () => null as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("resource returned by factory is null");
    });

    it("should reject when factory returns undefined", async () => {
      const module: AnyRModule = { default: () => undefined as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("invalid resource type returned by factory");
    });

    it("should reject when factory returns a string", async () => {
      const module: AnyRModule = { default: () => "not an object" as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(
        "invalid resource type returned by factory (string)"
      );
    });

    it("should reject when factory returns a number", async () => {
      const module: AnyRModule = { default: () => 42 as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(
        "invalid resource type returned by factory (number)"
      );
    });

    it("should wrap sync factory throw in RMachineError", async () => {
      const module: AnyRModule = {
        default: () => {
          throw new Error("sync boom");
        },
      };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("factory promise rejected");
    });
  });

  describe("with an async factory default export", () => {
    it("should resolve with the object returned by the async factory", async () => {
      const r = { greeting: "Hola" };
      const module: AnyRModule = { default: async () => r };
      const result = await resolveRFromModule(module, make$());
      expect(result).toBe(r);
    });

    it("should pass RCtx to the async factory", async () => {
      const factory = vi.fn(async () => ({ key: "value" }));
      const $ = make$({ namespace: "footer", locale: "fr" });
      await resolveRFromModule({ default: factory }, $);
      expect(factory).toHaveBeenCalledWith($);
    });

    it("should reject when async factory resolves to null", async () => {
      const module: AnyRModule = { default: async () => null as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("resource returned by factory is null");
    });

    it("should reject when async factory resolves to a primitive", async () => {
      const module: AnyRModule = { default: async () => "bad" as any };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(
        "invalid resource type returned by factory (string)"
      );
    });

    it("should reject when async factory rejects", async () => {
      const module: AnyRModule = {
        default: async () => {
          throw new Error("network failure");
        },
      };
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("factory promise rejected");
    });
  });

  describe("with invalid module or default export", () => {
    it("should reject when module is null", async () => {
      await expect(resolveRFromModule(null as any, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(null as any, make$())).rejects.toThrow("module is not an object");
    });

    it("should reject when module is undefined", async () => {
      await expect(resolveRFromModule(undefined as any, make$())).rejects.toThrow("module is not an object");
    });

    it("should reject when module is a string", async () => {
      await expect(resolveRFromModule("bad" as any, make$())).rejects.toThrow("module is not an object");
    });

    it("should reject when module is a number", async () => {
      await expect(resolveRFromModule(42 as any, make$())).rejects.toThrow("module is not an object");
    });

    it("should reject when default export is null", async () => {
      const module = { default: null } as any;
      await expect(resolveRFromModule(module, make$())).rejects.toThrow(RMachineError);
      await expect(resolveRFromModule(module, make$())).rejects.toThrow("exported resource is null");
    });

    it("should reject when default export is a string", async () => {
      await expect(resolveRFromModule({ default: "not valid" } as any, make$())).rejects.toThrow(
        "invalid export type (string)"
      );
    });

    it("should reject when default export is a number", async () => {
      await expect(resolveRFromModule({ default: 123 } as any, make$())).rejects.toThrow(
        "invalid export type (number)"
      );
    });

    it("should reject when default export is a boolean", async () => {
      await expect(resolveRFromModule({ default: true } as any, make$())).rejects.toThrow(
        "invalid export type (boolean)"
      );
    });

    it("should reject when default export is undefined", async () => {
      await expect(resolveRFromModule({ default: undefined } as any, make$())).rejects.toThrow(
        "invalid export type (undefined)"
      );
    });
  });

  describe("error messages", () => {
    it("should include namespace and locale in error messages", async () => {
      const $ = make$({ namespace: "settings", locale: "ja" });
      await expect(resolveRFromModule(null as any, $)).rejects.toThrow('"settings"');
      await expect(resolveRFromModule(null as any, $)).rejects.toThrow('"ja"');
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
    it("should resolve the resource from a static default export", async () => {
      const r = { hello: "world" };
      const resolver = makeResolver({ default: r });
      const result = await resolveR(resolver, "common", "en", noFmt);
      expect(result).toBe(r);
    });

    it("should resolve the resource from a factory default export", async () => {
      const r = { greeting: "Hi" };
      const resolver = makeResolver({ default: () => r });
      const result = await resolveR(resolver, "common", "en", noFmt);
      expect(result).toBe(r);
    });

    it("should resolve the resource from an async factory default export", async () => {
      const r = { greeting: "Bonjour" };
      const resolver = makeResolver({ default: async () => r });
      const result = await resolveR(resolver, "common", "fr", noFmt);
      expect(result).toBe(r);
    });
  });

  describe("passes correct arguments", () => {
    it("should pass namespace and locale to the resolver", async () => {
      const resolver = vi.fn(async () => ({ default: { key: "val" } }));
      await resolveR(resolver, "auth", "de", noFmt);
      expect(resolver).toHaveBeenCalledWith("auth", "de");
    });

    it("should pass RCtx with correct namespace and locale to factory", async () => {
      const factory = vi.fn(($: RCtx) => ({ ns: $.namespace, loc: $.locale }));
      const resolver: RModuleResolver = async () => ({ default: factory });
      const result = await resolveR(resolver, "nav", "it", noFmt);
      expect(factory).toHaveBeenCalledWith({ namespace: "nav", locale: "it", fmt: undefined });
      expect(result).toEqual({ ns: "nav", loc: "it" });
    });
  });

  describe("resolver failure", () => {
    it("should reject with RMachineError including namespace and locale", async () => {
      const resolver: RModuleResolver = async () => {
        throw new Error("import failed");
      };
      await expect(resolveR(resolver, "dashboard", "zh", noFmt)).rejects.toThrow(RMachineError);
      await expect(resolveR(resolver, "dashboard", "zh", noFmt)).rejects.toThrow("rModuleResolver failed");
      await expect(resolveR(resolver, "dashboard", "zh", noFmt)).rejects.toThrow('"dashboard"');
      await expect(resolveR(resolver, "dashboard", "zh", noFmt)).rejects.toThrow('"zh"');
    });
  });

  describe("formatter integration", () => {
    it("should pass formatter result to factory via RCtx.fmt", async () => {
      const fmtGetter: AnyFmtGetter = (locale) => ({ lang: locale });
      const factory = vi.fn(($: RCtx) => ({ result: $.fmt }));
      const resolver: RModuleResolver = async () => ({ default: factory });
      const result = await resolveR(resolver, "common", "en", fmtGetter);
      expect(factory).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: "common", locale: "en", fmt: { lang: "en" } })
      );
      expect(result).toEqual({ result: { lang: "en" } });
    });

    it("should call formatter getter with the correct locale", async () => {
      const fmtGetter = vi.fn((_locale: string) => ({ v: 1 }));
      const resolver: RModuleResolver = async () => ({ default: {} });
      await resolveR(resolver, "nav", "it", fmtGetter);
      expect(fmtGetter).toHaveBeenCalledWith("it");
    });
  });

  describe("module resolution failure (propagated from resolveRFromModule)", () => {
    it("should reject when resolved module has null default", async () => {
      const resolver = makeResolver({ default: null } as any);
      await expect(resolveR(resolver, "common", "en", noFmt)).rejects.toThrow("exported resource is null");
    });

    it("should reject when resolved module has invalid default type", async () => {
      const resolver = makeResolver({ default: "bad" } as any);
      await expect(resolveR(resolver, "common", "en", noFmt)).rejects.toThrow("invalid export type (string)");
    });

    it("should reject when factory in resolved module returns null", async () => {
      const resolver = makeResolver({ default: () => null as any });
      await expect(resolveR(resolver, "common", "en", noFmt)).rejects.toThrow("resource returned by factory is null");
    });

    it("should reject when async factory in resolved module rejects", async () => {
      const resolver = makeResolver({
        default: async () => {
          throw new Error("async fail");
        },
      });
      await expect(resolveR(resolver, "common", "en", noFmt)).rejects.toThrow("factory promise rejected");
    });
  });
});

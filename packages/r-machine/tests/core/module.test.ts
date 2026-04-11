import { describe, expect, it, vi } from "vitest";
import { type AnyModule, createModuleLoader, type ModuleLoaderFn, validateModule } from "../../src/core/module.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import type { PathResolver } from "../../src/core/resource-layout.js";
import type { AnyResourcePlug } from "../../src/core/resource-plug.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

// Minimal, realistic AnyModule factory — keeps tests readable and lets us assert
// on identity when we care about "same promise / same object".
function makeModule(tag: string): AnyModule {
  return { r: { tag } };
}

describe("createModuleLoader", () => {
  describe("delegation contract", () => {
    it("computes the path via resolvePath and forwards it to loadModuleFn along with the original (namespace, locale)", async () => {
      const resolvePath = vi.fn<PathResolver>((ns, locale) => `${ns}@${locale ?? "∅"}`);
      const module = makeModule("ok");
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => module);

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      await loadModule("app/home", "en-US");

      expect(resolvePath).toHaveBeenCalledTimes(1);
      expect(resolvePath).toHaveBeenCalledWith("app/home", "en-US");
      expect(loadModuleFn).toHaveBeenCalledTimes(1);
      expect(loadModuleFn).toHaveBeenCalledWith("app/home@en-US", "app/home", "en-US");
    });

    it("passes `undefined` locale through verbatim to both resolvePath and loadModuleFn", async () => {
      // Critical for gear/dynamic-shell layouts, which legitimately accept an
      // undefined locale. The loader must not coerce undefined into a string.
      const resolvePath = vi.fn<PathResolver>((ns) => ns);
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => makeModule("ok"));

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      await loadModule("app", undefined);

      expect(resolvePath).toHaveBeenCalledWith("app", undefined);
      expect(loadModuleFn).toHaveBeenCalledWith("app", "app", undefined);
      // Positional check: undefined must occupy arg index 2 (not be dropped).
      expect(loadModuleFn.mock.calls[0]?.length).toBe(3);
      expect(loadModuleFn.mock.calls[0]?.[2]).toBeUndefined();
    });

    it("invokes resolvePath strictly before loadModuleFn", async () => {
      const order: string[] = [];
      const resolvePath: PathResolver = (ns) => {
        order.push("resolvePath");
        return ns;
      };
      const loadModuleFn: ModuleLoaderFn = async () => {
        order.push("loadModuleFn");
        return makeModule("ok");
      };

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      await loadModule("app", undefined);

      expect(order).toEqual(["resolvePath", "loadModuleFn"]);
    });

    it("does not call loadModuleFn if resolvePath is never invoked (lazy at call-time, not at factory-time)", () => {
      // Constructing the loader must have zero side effects: resolvePath and
      // loadModuleFn should only run once the returned loader is actually called.
      const resolvePath = vi.fn<PathResolver>((ns) => ns);
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => makeModule("ok"));

      createModuleLoader(resolvePath, loadModuleFn);

      expect(resolvePath).not.toHaveBeenCalled();
      expect(loadModuleFn).not.toHaveBeenCalled();
    });
  });

  describe("return-value identity", () => {
    it("returns the exact promise instance produced by loadModuleFn (no wrapping, no await)", async () => {
      // The source function is intentionally non-async: it returns whatever
      // loadModuleFn returns. Re-wrapping would defeat that and introduce an
      // extra microtask, so we assert referential equality of the promise itself.
      const promise: Promise<AnyModule> = Promise.resolve(makeModule("ok"));
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn: ModuleLoaderFn = () => promise;

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      const result = loadModule("app", undefined);

      expect(result).toBe(promise);
      await result; // drain, for cleanliness.
    });

    it("resolves to the exact module object produced by loadModuleFn (no cloning)", async () => {
      const module = makeModule("singleton");
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn: ModuleLoaderFn = async () => module;

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      const result = await loadModule("app", undefined);

      expect(result).toBe(module);
      expect(result.r).toBe(module.r);
    });
  });

  describe("error propagation", () => {
    it("propagates synchronous throws from resolvePath synchronously (without calling loadModuleFn)", () => {
      // resolvePath is synchronous by contract, and the loader body is not
      // async, so a throw here surfaces synchronously — not as a rejected
      // promise. We document that precisely.
      const boom = new Error("resolvePath failed");
      const resolvePath: PathResolver = () => {
        throw boom;
      };
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => makeModule("unused"));

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);

      try {
        loadModule("app", undefined);
        expect.unreachable("expected loadModule to throw synchronously");
      } catch (error) {
        expect(error).toBe(boom);
      }
      expect(loadModuleFn).not.toHaveBeenCalled();
    });

    it("propagates synchronous throws from loadModuleFn synchronously", () => {
      // loadModuleFn's type is async, but at runtime the loader just calls it
      // and returns whatever it gives back. A poorly-behaved implementation
      // that throws synchronously must not be swallowed.
      const boom = new Error("sync throw from loader");
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn = (() => {
        throw boom;
      }) as unknown as ModuleLoaderFn;

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);

      try {
        loadModule("app", undefined);
        expect.unreachable("expected loadModule to rethrow the synchronous throw");
      } catch (error) {
        expect(error).toBe(boom);
      }
    });

    it("surfaces rejections from loadModuleFn as rejections of the returned promise", async () => {
      const boom = new Error("async failure");
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn: ModuleLoaderFn = async () => {
        throw boom;
      };

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);

      await expect(loadModule("app", undefined)).rejects.toBe(boom);
    });
  });

  describe("statelessness across calls", () => {
    it("invokes resolvePath and loadModuleFn once per call, with the call-site arguments", async () => {
      const resolvePath = vi.fn<PathResolver>((ns, locale) => `${ns}/${locale ?? "∅"}`);
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async (path) => makeModule(path));

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);

      await loadModule("app", "en-US");
      await loadModule("app", "it-IT");
      await loadModule("app/admin", undefined);

      expect(resolvePath).toHaveBeenCalledTimes(3);
      expect(resolvePath.mock.calls).toEqual([
        ["app", "en-US"],
        ["app", "it-IT"],
        ["app/admin", undefined],
      ]);

      expect(loadModuleFn).toHaveBeenCalledTimes(3);
      expect(loadModuleFn.mock.calls).toEqual([
        ["app/en-US", "app", "en-US"],
        ["app/it-IT", "app", "it-IT"],
        ["app/admin/∅", "app/admin", undefined],
      ]);
    });

    it("does not cache or dedupe: two identical calls invoke the dependencies twice", async () => {
      // The loader is a thin adapter — memoization is a concern of higher layers.
      // This test pins that contract so future refactors do not silently add a cache.
      const resolvePath = vi.fn<PathResolver>((ns) => ns);
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => makeModule("ok"));

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      await loadModule("app", "en-US");
      await loadModule("app", "en-US");

      expect(resolvePath).toHaveBeenCalledTimes(2);
      expect(loadModuleFn).toHaveBeenCalledTimes(2);
    });

    it("returns a fresh promise per call even when loadModuleFn is implemented by closing over a single module", async () => {
      const module = makeModule("shared");
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn: ModuleLoaderFn = async () => module;

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      const p1 = loadModule("app", undefined);
      const p2 = loadModule("app", undefined);

      expect(p1).not.toBe(p2); // distinct promise objects
      await expect(p1).resolves.toBe(module);
      await expect(p2).resolves.toBe(module);
    });
  });

  describe("result-shape pass-through", () => {
    it("accepts any AnyResourceOrigin shape that loadModuleFn returns (plain resource)", async () => {
      const resource = { greeting: "hi", nested: { n: 1 } };
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn: ModuleLoaderFn = async () => ({ r: resource });

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      const result = await loadModule("app", undefined);

      expect(result.r).toBe(resource);
    });

    it("accepts an AnyResourceOrigin shape that is a matrix-like object (opaque to the loader)", async () => {
      // The loader does not inspect `r`; whatever loadModuleFn hands back
      // travels through untouched. We use a plausible matrix-ish object here
      // (factory + plug) without actually importing ResMatrix's brand.
      const pkgLike = { factory: async () => ({}), plug: {} };
      const resolvePath: PathResolver = (ns) => ns;
      const loadModuleFn: ModuleLoaderFn = async () => ({ r: pkgLike }) as unknown as AnyModule;

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      const result = await loadModule("app", undefined);

      expect(result.r).toBe(pkgLike);
    });
  });

  describe("dependency isolation", () => {
    it("does not inspect or mutate the namespace/locale arguments it forwards", async () => {
      // Guards against accidental string manipulation inside the loader.
      const resolvePath = vi.fn<PathResolver>((ns, locale) => `${ns}|${locale}`);
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => makeModule("ok"));

      const ns = "app/home";
      const locale = "en-US";

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      await loadModule(ns, locale);

      // Same primitive values, at the same positions.
      expect(resolvePath.mock.calls[0]?.[0]).toBe(ns);
      expect(resolvePath.mock.calls[0]?.[1]).toBe(locale);
      expect(loadModuleFn.mock.calls[0]?.[1]).toBe(ns);
      expect(loadModuleFn.mock.calls[0]?.[2]).toBe(locale);
    });

    it("uses the path produced by resolvePath verbatim, even when it differs from the namespace (shell layout)", async () => {
      // Simulates a shell-style path resolver that appends the locale.
      const resolvePath: PathResolver = (ns, locale) => `${ns}/${locale}`;
      const loadModuleFn = vi.fn<ModuleLoaderFn>(async () => makeModule("ok"));

      const loadModule = createModuleLoader(resolvePath, loadModuleFn);
      await loadModule("app", "it-IT");

      expect(loadModuleFn).toHaveBeenCalledWith("app/it-IT", "app", "it-IT");
    });
  });
});

describe("validateModule", () => {
  describe("happy paths — returns null", () => {
    it("returns null when `r` is a raw resource object", () => {
      expect(validateModule({ r: { greeting: "hi" } })).toBeNull();
    });

    it("returns null when `r` is a ResMatrix", () => {
      const mat = createResMatrix(
        { family: "gear", isReactive: false, isVertex: false },
        async () => ({}),
        {} as AnyResourcePlug
      );

      expect(validateModule({ r: mat })).toBeNull();
    });

    it("accepts a module whose `r` is an empty object (the smallest valid raw resource)", () => {
      expect(validateModule({ r: {} })).toBeNull();
    });

    it("ignores extra own properties on the module envelope (only `r` is required)", () => {
      // The interface doesn't forbid extras; the validator shouldn't either.
      // Future metadata fields can be added by the loader without breaking
      // the contract.
      expect(validateModule({ r: { ok: true }, extra: 1, meta: "kept" })).toBeNull();
    });

    it("accepts an `r` that is a frozen object, with a frozen envelope", () => {
      const frozen = Object.freeze({ greeting: "hi" });
      const input = Object.freeze({ r: frozen });

      expect(validateModule(input)).toBeNull();
    });
  });

  describe("invalid envelope", () => {
    it.each([
      { label: "null", value: null, typeToken: "null" },
      { label: "undefined", value: undefined, typeToken: "undefined" },
      { label: "string", value: "not-a-module", typeToken: "string" },
      { label: "number", value: 42, typeToken: "number" },
      { label: "boolean", value: true, typeToken: "boolean" },
    ])("rejects $label at the top level with an RMachineResolveError", ({ value, typeToken }) => {
      const result = validateModule(value);

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("expected an object");
      expect(error.message).toContain(typeToken);
    });

    it("rejects a function at the top level (functions are not valid module envelopes)", () => {
      // `typeof (() => {}) === "function"`, not "object" — guard pins this.
      const result = validateModule(() => ({ r: {} }));

      expect(result).toBeInstanceOf(RMachineResolveError);
      expect((result as RMachineResolveError).message).toContain("function");
    });

    it("rejects an object without the `r` property with a dedicated message", () => {
      const result = validateModule({ notR: "wrong key" });

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain(`missing required property "r"`);
    });
  });

  describe("invalid `r`", () => {
    it("rejects `{ r: null }` — null is the classic footgun the guard must catch", () => {
      const result = validateModule({ r: null });

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain(`property "r"`);
      expect(error.message).toContain("null");
    });

    it("rejects `{ r: undefined }` even though the key is technically present", () => {
      // `"r" in input` is true, but the value is `undefined` — the guard
      // must still reject this as a non-origin.
      const result = validateModule({ r: undefined });

      expect(result).toBeInstanceOf(RMachineResolveError);
      expect((result as RMachineResolveError).message).toContain("undefined");
    });

    it.each([
      { label: "string", value: "hello", typeToken: "string" },
      { label: "number", value: 0, typeToken: "number" },
      { label: "boolean", value: false, typeToken: "boolean" },
      { label: "symbol", value: Symbol("x"), typeToken: "symbol" },
      { label: "bigint", value: 1n, typeToken: "bigint" },
    ])("rejects `{ r: $label }` with a message that names the offending type", ({ value, typeToken }) => {
      const result = validateModule({ r: value });

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain(typeToken);
    });

    it("rejects `{ r: () => {} }` — functions do not satisfy typeof === 'object'", () => {
      const result = validateModule({ r: () => ({}) });

      expect(result).toBeInstanceOf(RMachineResolveError);
      expect((result as RMachineResolveError).message).toContain("function");
    });
  });

  describe("purity and isolation", () => {
    it("does not mutate the input on the happy path", () => {
      const r = { greeting: "hi" };
      const input = { r, extra: 42 };
      const snapshot = { ...input };

      validateModule(input);

      expect(input).toEqual(snapshot);
      expect(input.r).toBe(r);
    });

    it("does not mutate the input on the error path", () => {
      const input = { r: null, extra: 42 };
      const snapshot = { ...input };

      validateModule(input);

      expect(input).toEqual(snapshot);
    });

    it("returns a fresh RMachineResolveError per failing call (errors must not be shared)", () => {
      // Sharing an error object across calls would break stack-trace fidelity
      // and make logs impossible to correlate with the call site.
      const e1 = validateModule(null);
      const e2 = validateModule(null);

      expect(e1).toBeInstanceOf(RMachineResolveError);
      expect(e2).toBeInstanceOf(RMachineResolveError);
      expect(e1).not.toBe(e2);
    });

    it("returns without throwing, even for pathologically-shaped input", () => {
      // The validator's contract is to RETURN errors, not throw them. A
      // caller wiring it into a larger validation chain must be able to rely
      // on this — an unexpected throw would break `if (result instanceof …)`.
      expect(() => validateModule(null)).not.toThrow();
      expect(() => validateModule(undefined)).not.toThrow();
      expect(() => validateModule({ r: null })).not.toThrow();
      expect(() => validateModule({})).not.toThrow();
      expect(() => validateModule({ r: {} })).not.toThrow();
    });
  });
});

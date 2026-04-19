import { describe, expect, it, vi } from "vitest";
import type { ResPathResolver } from "../../src/core/res-layout.js";
import { createResMatrix } from "../../src/core/res-matrix.js";
import {
  type AnyResModule,
  createResModuleLoader,
  type ResModuleLoaderFn,
  validateResModule,
} from "../../src/core/res-module.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

// Minimal, realistic AnyResModule factory — keeps tests readable and lets us assert
// on identity when we care about "same promise / same object".
function makeModule(tag: string): AnyResModule {
  return { r: { tag } };
}

describe("createResModuleLoader", () => {
  describe("delegation contract", () => {
    it("computes the path via resolveResPath and forwards it to loadModuleFn along with the original (namespace, locale)", async () => {
      const resolveResPath = vi.fn<ResPathResolver>((ns, locale) => `${ns}@${locale ?? "∅"}`);
      const module = makeModule("ok");
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => module);

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      await loadModule("app/home", "en-US");

      expect(resolveResPath).toHaveBeenCalledTimes(1);
      expect(resolveResPath).toHaveBeenCalledWith("app/home", "en-US");
      expect(loadModuleFn).toHaveBeenCalledTimes(1);
      expect(loadModuleFn).toHaveBeenCalledWith("app/home@en-US", "app/home", "en-US");
    });

    it("passes `undefined` locale through verbatim to both resolveResPath and loadModuleFn", async () => {
      // Critical for gear/shell:mono layouts, which legitimately accept an
      // undefined locale. The loader must not coerce undefined into a string.
      const resolveResPath = vi.fn<ResPathResolver>((ns) => ns);
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => makeModule("ok"));

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      await loadModule("app", undefined);

      expect(resolveResPath).toHaveBeenCalledWith("app", undefined);
      expect(loadModuleFn).toHaveBeenCalledWith("app", "app", undefined);
      // Positional check: undefined must occupy arg index 2 (not be dropped).
      expect(loadModuleFn.mock.calls[0]?.length).toBe(3);
      expect(loadModuleFn.mock.calls[0]?.[2]).toBeUndefined();
    });

    it("invokes resolveResPath strictly before loadModuleFn", async () => {
      const order: string[] = [];
      const resolveResPath: ResPathResolver = (ns) => {
        order.push("resolveResPath");
        return ns;
      };
      const loadModuleFn: ResModuleLoaderFn = async () => {
        order.push("loadModuleFn");
        return makeModule("ok");
      };

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      await loadModule("app", undefined);

      expect(order).toEqual(["resolveResPath", "loadModuleFn"]);
    });

    it("does not call loadModuleFn if resolveResPath is never invoked (lazy at call-time, not at factory-time)", () => {
      // Constructing the loader must have zero side effects: resolveResPath and
      // loadModuleFn should only run once the returned loader is actually called.
      const resolveResPath = vi.fn<ResPathResolver>((ns) => ns);
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => makeModule("ok"));

      createResModuleLoader(resolveResPath, loadModuleFn);

      expect(resolveResPath).not.toHaveBeenCalled();
      expect(loadModuleFn).not.toHaveBeenCalled();
    });
  });

  describe("return-value identity", () => {
    it("returns the exact promise instance produced by loadModuleFn (no wrapping, no await)", async () => {
      // The source function is intentionally non-async: it returns whatever
      // loadModuleFn returns. Re-wrapping would defeat that and introduce an
      // extra microtask, so we assert referential equality of the promise itself.
      const promise: Promise<AnyResModule> = Promise.resolve(makeModule("ok"));
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn: ResModuleLoaderFn = () => promise;

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      const result = loadModule("app", undefined);

      expect(result).toBe(promise);
      await result; // drain, for cleanliness.
    });

    it("resolves to the exact module object produced by loadModuleFn (no cloning)", async () => {
      const module = makeModule("singleton");
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn: ResModuleLoaderFn = async () => module;

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      const result = await loadModule("app", undefined);

      expect(result).toBe(module);
      expect(result.r).toBe(module.r);
    });
  });

  describe("error propagation", () => {
    it("propagates synchronous throws from resolveResPath synchronously (without calling loadModuleFn)", () => {
      // resolveResPath is synchronous by contract, and the loader body is not
      // async, so a throw here surfaces synchronously — not as a rejected
      // promise. We document that precisely.
      const boom = new Error("resolveResPath failed");
      const resolveResPath: ResPathResolver = () => {
        throw boom;
      };
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => makeModule("unused"));

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);

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
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn = (() => {
        throw boom;
      }) as unknown as ResModuleLoaderFn;

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);

      try {
        loadModule("app", undefined);
        expect.unreachable("expected loadModule to rethrow the synchronous throw");
      } catch (error) {
        expect(error).toBe(boom);
      }
    });

    it("surfaces rejections from loadModuleFn as rejections of the returned promise", async () => {
      const boom = new Error("async failure");
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn: ResModuleLoaderFn = async () => {
        throw boom;
      };

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);

      await expect(loadModule("app", undefined)).rejects.toBe(boom);
    });
  });

  describe("statelessness across calls", () => {
    it("invokes resolveResPath and loadModuleFn once per call, with the call-site arguments", async () => {
      const resolveResPath = vi.fn<ResPathResolver>((ns, locale) => `${ns}/${locale ?? "∅"}`);
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async (path) => makeModule(path));

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);

      await loadModule("app", "en-US");
      await loadModule("app", "it-IT");
      await loadModule("app/admin", undefined);

      expect(resolveResPath).toHaveBeenCalledTimes(3);
      expect(resolveResPath.mock.calls).toEqual([
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
      const resolveResPath = vi.fn<ResPathResolver>((ns) => ns);
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => makeModule("ok"));

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      await loadModule("app", "en-US");
      await loadModule("app", "en-US");

      expect(resolveResPath).toHaveBeenCalledTimes(2);
      expect(loadModuleFn).toHaveBeenCalledTimes(2);
    });

    it("returns a fresh promise per call even when loadModuleFn is implemented by closing over a single module", async () => {
      const module = makeModule("shared");
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn: ResModuleLoaderFn = async () => module;

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      const p1 = loadModule("app", undefined);
      const p2 = loadModule("app", undefined);

      expect(p1).not.toBe(p2); // distinct promise objects
      await expect(p1).resolves.toBe(module);
      await expect(p2).resolves.toBe(module);
    });
  });

  describe("result-shape pass-through", () => {
    it("accepts any AnyResOrigin shape that loadModuleFn returns (plain resource)", async () => {
      const resource = { greeting: "hi", nested: { n: 1 } };
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn: ResModuleLoaderFn = async () => ({ r: resource });

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      const result = await loadModule("app", undefined);

      expect(result.r).toBe(resource);
    });

    it("accepts an AnyResOrigin shape that is a matrix-like object (opaque to the loader)", async () => {
      // The loader does not inspect `r`; whatever loadModuleFn hands back
      // travels through untouched. We use a plausible matrix-ish object here
      // (factory + plug) without actually importing ResMatrix's brand.
      const pkgLike = { factory: async () => ({}), plug: {} };
      const resolveResPath: ResPathResolver = (ns) => ns;
      const loadModuleFn: ResModuleLoaderFn = async () => ({ r: pkgLike }) as unknown as AnyResModule;

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      const result = await loadModule("app", undefined);

      expect(result.r).toBe(pkgLike);
    });
  });

  describe("dependency isolation", () => {
    it("does not inspect or mutate the namespace/locale arguments it forwards", async () => {
      // Guards against accidental string manipulation inside the loader.
      const resolveResPath = vi.fn<ResPathResolver>((ns, locale) => `${ns}|${locale}`);
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => makeModule("ok"));

      const ns = "app/home";
      const locale = "en-US";

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      await loadModule(ns, locale);

      // Same primitive values, at the same positions.
      expect(resolveResPath.mock.calls[0]?.[0]).toBe(ns);
      expect(resolveResPath.mock.calls[0]?.[1]).toBe(locale);
      expect(loadModuleFn.mock.calls[0]?.[1]).toBe(ns);
      expect(loadModuleFn.mock.calls[0]?.[2]).toBe(locale);
    });

    it("uses the path produced by resolveResPath verbatim, even when it differs from the namespace (shell layout)", async () => {
      // Simulates a shell-style path resolver that appends the locale.
      const resolveResPath: ResPathResolver = (ns, locale) => `${ns}/${locale}`;
      const loadModuleFn = vi.fn<ResModuleLoaderFn>(async () => makeModule("ok"));

      const loadModule = createResModuleLoader(resolveResPath, loadModuleFn);
      await loadModule("app", "it-IT");

      expect(loadModuleFn).toHaveBeenCalledWith("app/it-IT", "app", "it-IT");
    });
  });
});

describe("validateResModule", () => {
  describe("happy paths — returns null", () => {
    it("returns null when `r` is a raw resource object", () => {
      expect(validateResModule({ r: { greeting: "hi" } })).toBeNull();
    });

    it("returns null when `r` is a ResMatrix", () => {
      const mat = createResMatrix(
        { family: "gear", isReactive: false, isVertex: false },
        async () => ({}),
        {} as AnyResPlug
      );

      expect(validateResModule({ r: mat })).toBeNull();
    });

    it("accepts a module whose `r` is an empty object (the smallest valid raw resource)", () => {
      expect(validateResModule({ r: {} })).toBeNull();
    });

    it("ignores extra own properties on the module envelope (only `r` is required)", () => {
      // The interface doesn't forbid extras; the validator shouldn't either.
      // Future metadata fields can be added by the loader without breaking
      // the contract.
      expect(validateResModule({ r: { ok: true }, extra: 1, meta: "kept" })).toBeNull();
    });

    it("accepts an `r` that is a frozen object, with a frozen envelope", () => {
      const frozen = Object.freeze({ greeting: "hi" });
      const input = Object.freeze({ r: frozen });

      expect(validateResModule(input)).toBeNull();
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
      const result = validateResModule(value);

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("expected an object");
      expect(error.message).toContain(typeToken);
    });

    it("rejects a function at the top level (functions are not valid module envelopes)", () => {
      // `typeof (() => {}) === "function"`, not "object" — guard pins this.
      const result = validateResModule(() => ({ r: {} }));

      expect(result).toBeInstanceOf(RMachineResolveError);
      expect((result as RMachineResolveError).message).toContain("function");
    });

    it("rejects an object without the `r` property with a dedicated message", () => {
      const result = validateResModule({ notR: "wrong key" });

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain(`missing required property "r"`);
    });
  });

  describe("invalid `r`", () => {
    it("rejects `{ r: null }` — null is the classic footgun the guard must catch", () => {
      const result = validateResModule({ r: null });

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain(`property "r"`);
      expect(error.message).toContain("null");
    });

    it("rejects `{ r: undefined }` even though the key is technically present", () => {
      // `"r" in input` is true, but the value is `undefined` — the guard
      // must still reject this as a non-origin.
      const result = validateResModule({ r: undefined });

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
      const result = validateResModule({ r: value });

      expect(result).toBeInstanceOf(RMachineResolveError);
      const error = result as RMachineResolveError;
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain(typeToken);
    });

    it("rejects `{ r: () => {} }` — functions do not satisfy typeof === 'object'", () => {
      const result = validateResModule({ r: () => ({}) });

      expect(result).toBeInstanceOf(RMachineResolveError);
      expect((result as RMachineResolveError).message).toContain("function");
    });
  });

  describe("purity and isolation", () => {
    it("does not mutate the input on the happy path", () => {
      const r = { greeting: "hi" };
      const input = { r, extra: 42 };
      const snapshot = { ...input };

      validateResModule(input);

      expect(input).toEqual(snapshot);
      expect(input.r).toBe(r);
    });

    it("does not mutate the input on the error path", () => {
      const input = { r: null, extra: 42 };
      const snapshot = { ...input };

      validateResModule(input);

      expect(input).toEqual(snapshot);
    });

    it("returns a fresh RMachineResolveError per failing call (errors must not be shared)", () => {
      // Sharing an error object across calls would break stack-trace fidelity
      // and make logs impossible to correlate with the call site.
      const e1 = validateResModule(null);
      const e2 = validateResModule(null);

      expect(e1).toBeInstanceOf(RMachineResolveError);
      expect(e2).toBeInstanceOf(RMachineResolveError);
      expect(e1).not.toBe(e2);
    });

    it("returns without throwing, even for pathologically-shaped input", () => {
      // The validator's contract is to RETURN errors, not throw them. A
      // caller wiring it into a larger validation chain must be able to rely
      // on this — an unexpected throw would break `if (result instanceof …)`.
      expect(() => validateResModule(null)).not.toThrow();
      expect(() => validateResModule(undefined)).not.toThrow();
      expect(() => validateResModule({ r: null })).not.toThrow();
      expect(() => validateResModule({})).not.toThrow();
      expect(() => validateResModule({ r: {} })).not.toThrow();
    });
  });
});

import { describe, expect, it } from "vitest";
import { createResMatrix } from "../../src/core/res-matrix.js";
import { validateResModule } from "../../src/core/res-module.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

describe("validateResModule", () => {
  describe("happy paths — returns null", () => {
    it("returns null when `r` is a raw resource object", () => {
      expect(validateResModule({ r: { greeting: "hi" } })).toBeNull();
    });

    it("returns null when `r` is a ResMatrix", () => {
      // validateResModule only checks that `r` is a non-null object. The
      // matrix's internal wiring is irrelevant here — pass minimal fakes
      // through `as never` casts.
      const mat = createResMatrix({
        connector: { getWire: async () => ({ plugin: undefined }) } as never,
        meta: { family: "gear", role: "inner" } as never,
        head: { realm: "res", family: "gear", mode: "list", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
        cursor: undefined,
        userFactory: async () => ({}),
      });

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

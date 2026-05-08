import { describe, expect, it, vi } from "vitest";
import type { AnyRes } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type GearMatrixMeta,
  type ShellMatrixMeta,
  tryGetResMatrixMeta,
} from "../../src/core/res-matrix.js";

// --- helpers -----------------------------------------------------------------

type AnyMeta = GearMatrixMeta | ShellMatrixMeta;

// Default options the tests share. createResMatrix takes a single options
// object now; the connector / head / cursor are wired by the manager in
// production. The tests under this file don't exercise resolution — they
// pin construction-time behavior — so passing minimal `as never` fakes is
// the same pattern blueprint-manager.test.ts uses.
function makeOptions(meta: AnyMeta, overrides?: { userFactory?: () => Promise<unknown> }) {
  return {
    connector: { getWire: async () => ({ plugin: undefined }) } as never,
    meta,
    head: { realm: "res", family: meta.family, mode: "list", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
    cursor: undefined,
    userFactory: overrides?.userFactory ?? (async () => ({})),
  };
}

const gearMeta: GearMatrixMeta = { family: "gear", role: "inner" };

// --- createResMatrix ---------------------------------------------------------

describe("createResMatrix", () => {
  describe("shape of the returned matrix", () => {
    it("returns an object that exposes factory, plug and clone as own properties", () => {
      const mat = createResMatrix(makeOptions(gearMeta));

      expect(typeof mat.factory).toBe("function");
      expect(mat.plug).toBeDefined();
      expect(typeof mat.clone).toBe("function");
    });

    it("stores the meta under an internal key retrievable via tryGetResMatrixMeta", () => {
      // The symbol key is module-private, so the only legitimate way to read
      // the meta back is through the dedicated accessor. This test pins
      // that contract: construct + read must round-trip exactly.
      const meta: ShellMatrixMeta = { family: "shell" };
      const mat = createResMatrix(makeOptions(meta));

      expect(tryGetResMatrixMeta(mat)).toBe(meta);
    });

    it("does not surface the meta as a `meta` own property on the returned object", () => {
      // Regression guard: the interface deliberately keeps the meta under a
      // symbol key. A public mirror would defeat the encapsulation — callers
      // must go through tryGetResMatrixMeta.
      const mat = createResMatrix(makeOptions(gearMeta));

      expect("meta" in mat).toBe(false);
    });

    it("lists exactly the public string-keyed own properties: `factory`, `plug`, `clone`", () => {
      // No accidental extras leaking into the public surface. The meta
      // lives under a symbol key and must not appear in Object.keys().
      const mat = createResMatrix(makeOptions(gearMeta));

      expect(Object.keys(mat).sort()).toEqual(["clone", "factory", "plug"]);
    });
  });

  describe("identity and non-mutation", () => {
    it("stores the meta by reference — no clone, no defensive copy", () => {
      // We rely on this to keep meta construction O(1) and to let
      // callers compare by identity if they ever need to dedupe.
      const meta: ShellMatrixMeta = { family: "shell" };
      const mat = createResMatrix(makeOptions(meta));

      expect(tryGetResMatrixMeta(mat)).toBe(meta);
    });

    it("does not mutate the meta argument", () => {
      const meta: GearMatrixMeta = { family: "gear", role: "outer" };
      const snapshot = { ...meta };

      createResMatrix(makeOptions(meta));

      expect(meta).toEqual(snapshot);
    });

    it("does not freeze the meta argument (freezing is the caller's choice)", () => {
      const meta: GearMatrixMeta = { family: "gear", role: "inner" };

      createResMatrix(makeOptions(meta));

      expect(Object.isFrozen(meta)).toBe(false);
    });

    it("accepts a frozen meta and preserves its frozen state end-to-end", () => {
      const frozen = Object.freeze({ family: "shell" } as const) satisfies ShellMatrixMeta;

      const mat = createResMatrix(makeOptions(frozen));
      const retrieved = tryGetResMatrixMeta(mat);

      expect(retrieved).toBe(frozen);
      expect(Object.isFrozen(retrieved)).toBe(true);
    });

    it("produces distinct matrix objects on every call, even with the same arguments", () => {
      // The factory must not memoize — two call sites that happen to pass the
      // same meta should still get independent matrices so they can be
      // tracked, cached, or disposed independently.
      const meta: GearMatrixMeta = { family: "gear", role: "base" };

      const m1 = createResMatrix(makeOptions(meta));
      const m2 = createResMatrix(makeOptions(meta));

      expect(m1).not.toBe(m2);
      // Meta is shared by reference (same object), but the matrices and
      // their wrapped factories/plugs are independent.
      expect(tryGetResMatrixMeta(m1)).toBe(tryGetResMatrixMeta(m2));
    });
  });

  describe("userFactory is wrapped, not invoked at construction time", () => {
    it("never calls userFactory at construction time", () => {
      // userFactory is for lazy resolution — invoking it here would pull in
      // the resource eagerly and defeat the entire async-loading design.
      const userFactory = vi.fn(async () => ({ greeting: "hi" }) satisfies AnyRes);

      createResMatrix(makeOptions(gearMeta, { userFactory }));

      expect(userFactory).not.toHaveBeenCalled();
    });

    it("does not introspect userFactory's return value at construction time", () => {
      // A factory that throws when called must not affect createResMatrix,
      // because createResMatrix should never call it during construction.
      const boom = new Error("userFactory must not be called at construction");
      const throwing = async (): Promise<AnyRes> => {
        throw boom;
      };

      expect(() => createResMatrix(makeOptions(gearMeta, { userFactory: throwing }))).not.toThrow();
    });
  });
});

// --- tryGetResMatrixMeta ----------------------------------------------

describe("tryGetResMatrixMeta", () => {
  it("returns the meta for a matrix built via createResMatrix", () => {
    const meta: GearMatrixMeta = { family: "gear", role: "outer" };
    const mat = createResMatrix(makeOptions(meta));

    expect(tryGetResMatrixMeta(mat)).toEqual({ family: "gear", role: "outer" });
  });

  it("returns the exact same reference stored at construction time (identity round-trip)", () => {
    const meta: GearMatrixMeta = { family: "gear", role: "inner" };
    const mat = createResMatrix(makeOptions(meta));

    expect(tryGetResMatrixMeta(mat)).toBe(meta);
  });

  it("returns undefined for a plain AnyRes with no brand symbol", () => {
    const raw: AnyRes = { greeting: "hi", count: 3 };

    expect(tryGetResMatrixMeta(raw)).toBeUndefined();
  });

  it("returns undefined for an empty object", () => {
    // Minimal raw resource — the symbol key is unreachable from outside this
    // module, so the guard must return undefined.
    const raw: AnyRes = {};

    expect(tryGetResMatrixMeta(raw)).toBeUndefined();
  });

  it("returns undefined for a resource whose own string keys coincidentally look matrix-ish", () => {
    // Defensive regression: a raw resource that happens to have a `factory`
    // or `plug` property must NOT be misidentified as a matrix. The brand
    // symbol is the single source of truth.
    const raw: AnyRes = { factory: "not a factory", plug: "not a plug" };

    expect(tryGetResMatrixMeta(raw)).toBeUndefined();
  });

  it("returns undefined for a resource carrying an unrelated symbol key", () => {
    // Another module's symbol must never be mistaken for ours.
    const otherSymbol = Symbol("other");
    const raw = { [otherSymbol]: { family: "gear" } } as unknown as AnyRes;

    expect(tryGetResMatrixMeta(raw)).toBeUndefined();
  });
});

// --- integration: createResMatrix ⇄ tryGetResMatrixMeta ----------------

describe("createResMatrix ⇄ tryGetResMatrixMeta round-trip", () => {
  it("treats the matrix as assignable to AnyResMatrix at the type level", () => {
    // Lightweight sanity check that createResMatrix's return type flows into
    // any slot typed with the erased AnyResMatrix variant.
    const mat: AnyResMatrix = createResMatrix(makeOptions(gearMeta));

    expect(tryGetResMatrixMeta(mat)).toBeDefined();
  });

  it("round-trips every canonical family/role combination without drift", () => {
    const cases: AnyMeta[] = [
      { family: "gear", role: "inner" },
      { family: "gear", role: "base" },
      { family: "gear", role: "outer" },
      { family: "shell" },
    ];

    for (const meta of cases) {
      const mat = createResMatrix(makeOptions(meta));
      expect(tryGetResMatrixMeta(mat)).toEqual(meta);
    }
  });
});

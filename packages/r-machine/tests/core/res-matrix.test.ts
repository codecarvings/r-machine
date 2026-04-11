import { describe, expect, it, vi } from "vitest";
import type { AnyRes } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type ResMatrixData,
  tryGetResMatrixData,
} from "../../src/core/res-matrix.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";

// --- helpers -----------------------------------------------------------------

function makeData(overrides: Partial<ResMatrixData> = {}): ResMatrixData {
  return { family: "gear", isReactive: false, isVertex: false, ...overrides };
}

// A sentinel plug — we only care that the exact reference survives round-trip
// through createResMatrix without being cloned or wrapped.
const sentinelPlug = {} as AnyResPlug;

// --- createResMatrix ---------------------------------------------------------

describe("createResMatrix", () => {
  describe("shape of the returned matrix", () => {
    it("returns an object that exposes factory and plug as own properties", () => {
      const factory = async () => ({});
      const mat = createResMatrix(makeData(), factory, sentinelPlug);

      expect(mat.factory).toBe(factory);
      expect(mat.plug).toBe(sentinelPlug);
    });

    it("stores the data under an internal key retrievable via tryGetResMatrixData", () => {
      // The symbol key is module-private, so the only legitimate way to read
      // the data back is through the dedicated accessor. This test pins
      // that contract: construct + read must round-trip exactly.
      const data = makeData({ family: "shell", isReactive: true, isVertex: true });
      const mat = createResMatrix(data, async () => ({}), sentinelPlug);

      expect(tryGetResMatrixData(mat)).toBe(data);
    });

    it("does not surface the data as a `data` own property on the returned object", () => {
      // Regression guard: the interface deliberately dropped the old
      // `data` field when the symbol key took over. Keeping a public
      // mirror would defeat the encapsulation — callers must go through
      // tryGetResMatrixData.
      const mat = createResMatrix(makeData(), async () => ({}), sentinelPlug);

      expect("data" in mat).toBe(false);
    });

    it("lists exactly two string-keyed own properties: `factory` and `plug`", () => {
      // No accidental extras leaking into the public surface. The data
      // lives under a symbol key and must not appear in Object.keys().
      const mat = createResMatrix(makeData(), async () => ({}), sentinelPlug);

      expect(Object.keys(mat).sort()).toEqual(["factory", "plug"]);
    });
  });

  describe("identity and non-mutation", () => {
    it("stores the data by reference — no clone, no defensive copy", () => {
      // We rely on this to keep data construction O(1) and to let
      // callers compare by identity if they ever need to dedupe.
      const data = makeData({ family: "shell" });
      const mat = createResMatrix(data, async () => ({}), sentinelPlug);

      expect(tryGetResMatrixData(mat)).toBe(data);
    });

    it("does not mutate the data argument", () => {
      const data = makeData({ family: "shell", isReactive: true, isVertex: false });
      const snapshot = { ...data }; // shallow snapshot is enough since the fields are primitives

      createResMatrix(data, async () => ({}), sentinelPlug);

      expect(data).toEqual(snapshot);
    });

    it("does not freeze the data argument (freezing is the caller's choice)", () => {
      const data = makeData();

      createResMatrix(data, async () => ({}), sentinelPlug);

      expect(Object.isFrozen(data)).toBe(false);
    });

    it("accepts a frozen data and preserves its frozen state end-to-end", () => {
      const frozen = Object.freeze(makeData({ family: "shell" }));

      const mat = createResMatrix(frozen, async () => ({}), sentinelPlug);
      const retrieved = tryGetResMatrixData(mat);

      expect(retrieved).toBe(frozen);
      expect(Object.isFrozen(retrieved)).toBe(true);
    });

    it("produces distinct matrix objects on every call, even with the same arguments", () => {
      // The factory must not memoize — two call sites that happen to pass the
      // same data/factory/plug should still get independent matrices
      // so they can be tracked, cached, or disposed independently.
      const data = makeData();
      const factory = async () => ({});

      const m1 = createResMatrix(data, factory, sentinelPlug);
      const m2 = createResMatrix(data, factory, sentinelPlug);

      expect(m1).not.toBe(m2);
      // But the pieces they share are still identity-equal.
      expect(m1.factory).toBe(m2.factory);
      expect(m1.plug).toBe(m2.plug);
      expect(tryGetResMatrixData(m1)).toBe(tryGetResMatrixData(m2));
    });
  });

  describe("factory parameter is stored, not invoked", () => {
    it("never calls the factory at construction time", () => {
      // The factory is for lazy resolution — invoking it here would pull in
      // the resource eagerly and defeat the entire async-loading design.
      const factory = vi.fn(async () => ({ greeting: "hi" }) satisfies AnyRes);

      createResMatrix(makeData(), factory, sentinelPlug);

      expect(factory).not.toHaveBeenCalled();
    });

    it("stores the exact factory reference (no wrapping, no binding)", () => {
      const factory = async () => ({ a: 1 }) satisfies AnyRes;
      const mat = createResMatrix(makeData(), factory, sentinelPlug);

      expect(mat.factory).toBe(factory);
    });

    it("does not introspect the factory's return value at construction time", () => {
      // A factory that throws when called must not affect createResMatrix,
      // because createResMatrix should never call it.
      const boom = new Error("factory must not be called");
      const throwingFactory = async (): Promise<AnyRes> => {
        throw boom;
      };

      expect(() => createResMatrix(makeData(), throwingFactory, sentinelPlug)).not.toThrow();
    });
  });
});

// --- tryGetResMatrixData ----------------------------------------------

describe("tryGetResMatrixData", () => {
  it("returns the data for a matrix built via createResMatrix", () => {
    const data = makeData({ family: "shell", isReactive: true, isVertex: true });
    const mat = createResMatrix(data, async () => ({}), sentinelPlug);

    expect(tryGetResMatrixData(mat)).toEqual({
      family: "shell",
      isReactive: true,
      isVertex: true,
    });
  });

  it("returns the exact same reference stored at construction time (identity round-trip)", () => {
    const data = makeData();
    const mat = createResMatrix(data, async () => ({}), sentinelPlug);

    expect(tryGetResMatrixData(mat)).toBe(data);
  });

  it("returns undefined for a plain AnyRes with no brand symbol", () => {
    const raw: AnyRes = { greeting: "hi", count: 3 };

    expect(tryGetResMatrixData(raw)).toBeUndefined();
  });

  it("returns undefined for an empty object", () => {
    // Minimal raw resource — the symbol key is unreachable from outside this
    // module, so the guard must return undefined.
    const raw: AnyRes = {};

    expect(tryGetResMatrixData(raw)).toBeUndefined();
  });

  it("returns undefined for a resource whose own string keys coincidentally look matrix-ish", () => {
    // Defensive regression: a raw resource that happens to have a `factory`
    // or `plug` property must NOT be misidentified as a matrix. The brand
    // symbol is the single source of truth.
    const raw: AnyRes = { factory: "not a factory", plug: "not a plug" };

    expect(tryGetResMatrixData(raw)).toBeUndefined();
  });

  it("returns undefined for a resource carrying an unrelated symbol key", () => {
    // Another module's symbol must never be mistaken for ours.
    const otherSymbol = Symbol("other");
    const raw = { [otherSymbol]: { family: "gear" } } as unknown as AnyRes;

    expect(tryGetResMatrixData(raw)).toBeUndefined();
  });
});

// --- integration: createResMatrix ⇄ tryGetResMatrixData ----------------

describe("createResMatrix ⇄ tryGetResMatrixData round-trip", () => {
  it("treats the matrix as assignable to AnyResMatrix at the type level", () => {
    // Lightweight sanity check that the generic signature does not leak into
    // anything incompatible with AnyResMatrix (the erased variant used
    // throughout the runtime).
    const mat: AnyResMatrix = createResMatrix(makeData(), async () => ({}), sentinelPlug);

    expect(tryGetResMatrixData(mat)).toBeDefined();
  });

  it("round-trips every canonical family/flag combination without drift", () => {
    const cases: ResMatrixData[] = [
      { family: "gear", isReactive: false, isVertex: false },
      { family: "gear", isReactive: false, isVertex: true },
      { family: "gear", isReactive: true, isVertex: false },
      { family: "gear", isReactive: true, isVertex: true },
      { family: "shell", isReactive: false, isVertex: false },
      { family: "shell", isReactive: false, isVertex: true },
      { family: "shell", isReactive: true, isVertex: false },
      { family: "shell", isReactive: true, isVertex: true },
    ];

    for (const data of cases) {
      const mat = createResMatrix(data, async () => ({}), sentinelPlug);
      expect(tryGetResMatrixData(mat)).toEqual(data);
    }
  });
});

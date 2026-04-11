import { describe, expect, it, vi } from "vitest";
import type { AnyRes } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type ResMatrixMeta,
  tryGetResMatrixMeta,
} from "../../src/core/res-matrix.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";

// --- helpers -----------------------------------------------------------------

function makeMeta(overrides: Partial<ResMatrixMeta> = {}): ResMatrixMeta {
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
      const mat = createResMatrix(makeMeta(), factory, sentinelPlug);

      expect(mat.factory).toBe(factory);
      expect(mat.plug).toBe(sentinelPlug);
    });

    it("stores the meta under an internal key retrievable via tryGetResMatrixMeta", () => {
      // The symbol key is module-private, so the only legitimate way to read
      // the meta back is through the dedicated accessor. This test pins
      // that contract: construct + read must round-trip exactly.
      const meta = makeMeta({ family: "shell", isReactive: true, isVertex: true });
      const mat = createResMatrix(meta, async () => ({}), sentinelPlug);

      expect(tryGetResMatrixMeta(mat)).toBe(meta);
    });

    it("does not surface the meta as a `meta` own property on the returned object", () => {
      // Regression guard: the interface deliberately keeps the meta under a
      // symbol key. A public mirror would defeat the encapsulation — callers
      // must go through tryGetResMatrixMeta.
      const mat = createResMatrix(makeMeta(), async () => ({}), sentinelPlug);

      expect("meta" in mat).toBe(false);
    });

    it("lists exactly two string-keyed own properties: `factory` and `plug`", () => {
      // No accidental extras leaking into the public surface. The meta
      // lives under a symbol key and must not appear in Object.keys().
      const mat = createResMatrix(makeMeta(), async () => ({}), sentinelPlug);

      expect(Object.keys(mat).sort()).toEqual(["factory", "plug"]);
    });
  });

  describe("identity and non-mutation", () => {
    it("stores the meta by reference — no clone, no defensive copy", () => {
      // We rely on this to keep meta construction O(1) and to let
      // callers compare by identity if they ever need to dedupe.
      const meta = makeMeta({ family: "shell" });
      const mat = createResMatrix(meta, async () => ({}), sentinelPlug);

      expect(tryGetResMatrixMeta(mat)).toBe(meta);
    });

    it("does not mutate the meta argument", () => {
      const meta = makeMeta({ family: "shell", isReactive: true, isVertex: false });
      const snapshot = { ...meta }; // shallow snapshot is enough since the fields are primitives

      createResMatrix(meta, async () => ({}), sentinelPlug);

      expect(meta).toEqual(snapshot);
    });

    it("does not freeze the meta argument (freezing is the caller's choice)", () => {
      const meta = makeMeta();

      createResMatrix(meta, async () => ({}), sentinelPlug);

      expect(Object.isFrozen(meta)).toBe(false);
    });

    it("accepts a frozen meta and preserves its frozen state end-to-end", () => {
      const frozen = Object.freeze(makeMeta({ family: "shell" }));

      const mat = createResMatrix(frozen, async () => ({}), sentinelPlug);
      const retrieved = tryGetResMatrixMeta(mat);

      expect(retrieved).toBe(frozen);
      expect(Object.isFrozen(retrieved)).toBe(true);
    });

    it("produces distinct matrix objects on every call, even with the same arguments", () => {
      // The factory must not memoize — two call sites that happen to pass the
      // same meta/factory/plug should still get independent matrices
      // so they can be tracked, cached, or disposed independently.
      const meta = makeMeta();
      const factory = async () => ({});

      const m1 = createResMatrix(meta, factory, sentinelPlug);
      const m2 = createResMatrix(meta, factory, sentinelPlug);

      expect(m1).not.toBe(m2);
      // But the pieces they share are still identity-equal.
      expect(m1.factory).toBe(m2.factory);
      expect(m1.plug).toBe(m2.plug);
      expect(tryGetResMatrixMeta(m1)).toBe(tryGetResMatrixMeta(m2));
    });
  });

  describe("factory parameter is stored, not invoked", () => {
    it("never calls the factory at construction time", () => {
      // The factory is for lazy resolution — invoking it here would pull in
      // the resource eagerly and defeat the entire async-loading design.
      const factory = vi.fn(async () => ({ greeting: "hi" }) satisfies AnyRes);

      createResMatrix(makeMeta(), factory, sentinelPlug);

      expect(factory).not.toHaveBeenCalled();
    });

    it("stores the exact factory reference (no wrapping, no binding)", () => {
      const factory = async () => ({ a: 1 }) satisfies AnyRes;
      const mat = createResMatrix(makeMeta(), factory, sentinelPlug);

      expect(mat.factory).toBe(factory);
    });

    it("does not introspect the factory's return value at construction time", () => {
      // A factory that throws when called must not affect createResMatrix,
      // because createResMatrix should never call it.
      const boom = new Error("factory must not be called");
      const throwingFactory = async (): Promise<AnyRes> => {
        throw boom;
      };

      expect(() => createResMatrix(makeMeta(), throwingFactory, sentinelPlug)).not.toThrow();
    });
  });
});

// --- tryGetResMatrixMeta ----------------------------------------------

describe("tryGetResMatrixMeta", () => {
  it("returns the meta for a matrix built via createResMatrix", () => {
    const meta = makeMeta({ family: "shell", isReactive: true, isVertex: true });
    const mat = createResMatrix(meta, async () => ({}), sentinelPlug);

    expect(tryGetResMatrixMeta(mat)).toEqual({
      family: "shell",
      isReactive: true,
      isVertex: true,
    });
  });

  it("returns the exact same reference stored at construction time (identity round-trip)", () => {
    const meta = makeMeta();
    const mat = createResMatrix(meta, async () => ({}), sentinelPlug);

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
    // Lightweight sanity check that the generic signature does not leak into
    // anything incompatible with AnyResMatrix (the erased variant used
    // throughout the runtime).
    const mat: AnyResMatrix = createResMatrix(makeMeta(), async () => ({}), sentinelPlug);

    expect(tryGetResMatrixMeta(mat)).toBeDefined();
  });

  it("round-trips every canonical family/flag combination without drift", () => {
    const cases: ResMatrixMeta[] = [
      { family: "gear", isReactive: false, isVertex: false },
      { family: "gear", isReactive: false, isVertex: true },
      { family: "gear", isReactive: true, isVertex: false },
      { family: "gear", isReactive: true, isVertex: true },
      { family: "shell", isReactive: false, isVertex: false },
      { family: "shell", isReactive: false, isVertex: true },
      { family: "shell", isReactive: true, isVertex: false },
      { family: "shell", isReactive: true, isVertex: true },
    ];

    for (const meta of cases) {
      const mat = createResMatrix(meta, async () => ({}), sentinelPlug);
      expect(tryGetResMatrixMeta(mat)).toEqual(meta);
    }
  });
});

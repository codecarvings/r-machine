import { describe, expect, it, vi } from "vitest";
import type { AnyRes } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type ResMatrixDescriptor,
  tryGetResMatrixDescriptor,
} from "../../src/core/res-matrix.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";

// --- helpers -----------------------------------------------------------------

function makeDescriptor(overrides: Partial<ResMatrixDescriptor> = {}): ResMatrixDescriptor {
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
      const mat = createResMatrix(makeDescriptor(), factory, sentinelPlug);

      expect(mat.factory).toBe(factory);
      expect(mat.plug).toBe(sentinelPlug);
    });

    it("stores the descriptor under an internal key retrievable via tryGetResMatrixDescriptor", () => {
      // The symbol key is module-private, so the only legitimate way to read
      // the descriptor back is through the dedicated accessor. This test pins
      // that contract: construct + read must round-trip exactly.
      const descriptor = makeDescriptor({ family: "shell", isReactive: true, isVertex: true });
      const mat = createResMatrix(descriptor, async () => ({}), sentinelPlug);

      expect(tryGetResMatrixDescriptor(mat)).toBe(descriptor);
    });

    it("does not surface the descriptor as a `descriptor` own property on the returned object", () => {
      // Regression guard: the interface deliberately dropped the old
      // `descriptor` field when the symbol key took over. Keeping a public
      // mirror would defeat the encapsulation — callers must go through
      // tryGetResMatrixDescriptor.
      const mat = createResMatrix(makeDescriptor(), async () => ({}), sentinelPlug);

      expect("descriptor" in mat).toBe(false);
    });

    it("lists exactly two string-keyed own properties: `factory` and `plug`", () => {
      // No accidental extras leaking into the public surface. The descriptor
      // lives under a symbol key and must not appear in Object.keys().
      const mat = createResMatrix(makeDescriptor(), async () => ({}), sentinelPlug);

      expect(Object.keys(mat).sort()).toEqual(["factory", "plug"]);
    });
  });

  describe("identity and non-mutation", () => {
    it("stores the descriptor by reference — no clone, no defensive copy", () => {
      // We rely on this to keep descriptor construction O(1) and to let
      // callers compare by identity if they ever need to dedupe.
      const descriptor = makeDescriptor({ family: "shell" });
      const mat = createResMatrix(descriptor, async () => ({}), sentinelPlug);

      expect(tryGetResMatrixDescriptor(mat)).toBe(descriptor);
    });

    it("does not mutate the descriptor argument", () => {
      const descriptor = makeDescriptor({ family: "shell", isReactive: true, isVertex: false });
      const snapshot = { ...descriptor };

      createResMatrix(descriptor, async () => ({}), sentinelPlug);

      expect(descriptor).toEqual(snapshot);
    });

    it("does not freeze the descriptor argument (freezing is the caller's choice)", () => {
      const descriptor = makeDescriptor();

      createResMatrix(descriptor, async () => ({}), sentinelPlug);

      expect(Object.isFrozen(descriptor)).toBe(false);
    });

    it("accepts a frozen descriptor and preserves its frozen state end-to-end", () => {
      const frozen = Object.freeze(makeDescriptor({ family: "shell" }));

      const mat = createResMatrix(frozen, async () => ({}), sentinelPlug);
      const retrieved = tryGetResMatrixDescriptor(mat);

      expect(retrieved).toBe(frozen);
      expect(Object.isFrozen(retrieved)).toBe(true);
    });

    it("produces distinct matrix objects on every call, even with the same arguments", () => {
      // The factory must not memoize — two call sites that happen to pass the
      // same descriptor/factory/plug should still get independent matrices
      // so they can be tracked, cached, or disposed independently.
      const descriptor = makeDescriptor();
      const factory = async () => ({});

      const m1 = createResMatrix(descriptor, factory, sentinelPlug);
      const m2 = createResMatrix(descriptor, factory, sentinelPlug);

      expect(m1).not.toBe(m2);
      // But the pieces they share are still identity-equal.
      expect(m1.factory).toBe(m2.factory);
      expect(m1.plug).toBe(m2.plug);
      expect(tryGetResMatrixDescriptor(m1)).toBe(tryGetResMatrixDescriptor(m2));
    });
  });

  describe("factory parameter is stored, not invoked", () => {
    it("never calls the factory at construction time", () => {
      // The factory is for lazy resolution — invoking it here would pull in
      // the resource eagerly and defeat the entire async-loading design.
      const factory = vi.fn(async () => ({ greeting: "hi" }) satisfies AnyRes);

      createResMatrix(makeDescriptor(), factory, sentinelPlug);

      expect(factory).not.toHaveBeenCalled();
    });

    it("stores the exact factory reference (no wrapping, no binding)", () => {
      const factory = async () => ({ a: 1 }) satisfies AnyRes;
      const mat = createResMatrix(makeDescriptor(), factory, sentinelPlug);

      expect(mat.factory).toBe(factory);
    });

    it("does not introspect the factory's return value at construction time", () => {
      // A factory that throws when called must not affect createResMatrix,
      // because createResMatrix should never call it.
      const boom = new Error("factory must not be called");
      const throwingFactory = async (): Promise<AnyRes> => {
        throw boom;
      };

      expect(() => createResMatrix(makeDescriptor(), throwingFactory, sentinelPlug)).not.toThrow();
    });
  });
});

// --- tryGetResMatrixDescriptor ----------------------------------------------

describe("tryGetResMatrixDescriptor", () => {
  it("returns the descriptor for a matrix built via createResMatrix", () => {
    const descriptor = makeDescriptor({ family: "shell", isReactive: true, isVertex: true });
    const mat = createResMatrix(descriptor, async () => ({}), sentinelPlug);

    expect(tryGetResMatrixDescriptor(mat)).toEqual({
      family: "shell",
      isReactive: true,
      isVertex: true,
    });
  });

  it("returns the exact same reference stored at construction time (identity round-trip)", () => {
    const descriptor = makeDescriptor();
    const mat = createResMatrix(descriptor, async () => ({}), sentinelPlug);

    expect(tryGetResMatrixDescriptor(mat)).toBe(descriptor);
  });

  it("returns undefined for a plain AnyRes with no brand symbol", () => {
    const raw: AnyRes = { greeting: "hi", count: 3 };

    expect(tryGetResMatrixDescriptor(raw)).toBeUndefined();
  });

  it("returns undefined for an empty object", () => {
    // Minimal raw resource — the symbol key is unreachable from outside this
    // module, so the guard must return undefined.
    const raw: AnyRes = {};

    expect(tryGetResMatrixDescriptor(raw)).toBeUndefined();
  });

  it("returns undefined for a resource whose own string keys coincidentally look matrix-ish", () => {
    // Defensive regression: a raw resource that happens to have a `factory`
    // or `plug` property must NOT be misidentified as a matrix. The brand
    // symbol is the single source of truth.
    const raw: AnyRes = { factory: "not a factory", plug: "not a plug" };

    expect(tryGetResMatrixDescriptor(raw)).toBeUndefined();
  });

  it("returns undefined for a resource carrying an unrelated symbol key", () => {
    // Another module's symbol must never be mistaken for ours.
    const otherSymbol = Symbol("other");
    const raw = { [otherSymbol]: { family: "gear" } } as unknown as AnyRes;

    expect(tryGetResMatrixDescriptor(raw)).toBeUndefined();
  });
});

// --- integration: createResMatrix ⇄ tryGetResMatrixDescriptor ----------------

describe("createResMatrix ⇄ tryGetResMatrixDescriptor round-trip", () => {
  it("treats the matrix as assignable to AnyResMatrix at the type level", () => {
    // Lightweight sanity check that the generic signature does not leak into
    // anything incompatible with AnyResMatrix (the erased variant used
    // throughout the runtime).
    const mat: AnyResMatrix = createResMatrix(makeDescriptor(), async () => ({}), sentinelPlug);

    expect(tryGetResMatrixDescriptor(mat)).toBeDefined();
  });

  it("round-trips every canonical family/flag combination without drift", () => {
    const cases: ResMatrixDescriptor[] = [
      { family: "gear", isReactive: false, isVertex: false },
      { family: "gear", isReactive: false, isVertex: true },
      { family: "gear", isReactive: true, isVertex: false },
      { family: "gear", isReactive: true, isVertex: true },
      { family: "shell", isReactive: false, isVertex: false },
      { family: "shell", isReactive: false, isVertex: true },
      { family: "shell", isReactive: true, isVertex: false },
      { family: "shell", isReactive: true, isVertex: true },
    ];

    for (const descriptor of cases) {
      const mat = createResMatrix(descriptor, async () => ({}), sentinelPlug);
      expect(tryGetResMatrixDescriptor(mat)).toEqual(descriptor);
    }
  });
});

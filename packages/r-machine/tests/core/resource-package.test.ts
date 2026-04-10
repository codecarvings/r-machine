import { describe, expect, it, vi } from "vitest";
import type { AnyResource } from "../../src/core/resource.js";
import {
  type AnyResourcePackage,
  createResourcePackage,
  type ResourcePackageDescriptor,
  tryGetResourcePackageDescriptor,
} from "../../src/core/resource-package.js";
import type { AnyResourcePlug } from "../../src/core/resource-plug.js";

// --- helpers -----------------------------------------------------------------

function makeDescriptor(overrides: Partial<ResourcePackageDescriptor> = {}): ResourcePackageDescriptor {
  return { family: "gear", isReactive: false, isVertex: false, ...overrides };
}

// A sentinel plug — we only care that the exact reference survives round-trip
// through createResourcePackage without being cloned or wrapped.
const sentinelPlug = {} as AnyResourcePlug;

// --- createResourcePackage ---------------------------------------------------

describe("createResourcePackage", () => {
  describe("shape of the returned package", () => {
    it("returns an object that exposes factory and plug as own properties", () => {
      const factory = async () => ({});
      const pkg = createResourcePackage(makeDescriptor(), factory, sentinelPlug);

      expect(pkg.factory).toBe(factory);
      expect(pkg.plug).toBe(sentinelPlug);
    });

    it("stores the descriptor under an internal key retrievable via tryGetResourcePackageDescriptor", () => {
      // The symbol key is module-private, so the only legitimate way to read
      // the descriptor back is through the dedicated accessor. This test pins
      // that contract: construct + read must round-trip exactly.
      const descriptor = makeDescriptor({ family: "shell", isReactive: true, isVertex: true });
      const pkg = createResourcePackage(descriptor, async () => ({}), sentinelPlug);

      expect(tryGetResourcePackageDescriptor(pkg)).toBe(descriptor);
    });

    it("does not surface the descriptor as a `descriptor` own property on the returned object", () => {
      // Regression guard: the interface deliberately dropped the old
      // `descriptor` field when the symbol key took over. Keeping a public
      // mirror would defeat the encapsulation — callers must go through
      // tryGetResourcePackageDescriptor.
      const pkg = createResourcePackage(makeDescriptor(), async () => ({}), sentinelPlug);

      expect("descriptor" in pkg).toBe(false);
    });

    it("lists exactly two string-keyed own properties: `factory` and `plug`", () => {
      // No accidental extras leaking into the public surface. The descriptor
      // lives under a symbol key and must not appear in Object.keys().
      const pkg = createResourcePackage(makeDescriptor(), async () => ({}), sentinelPlug);

      expect(Object.keys(pkg).sort()).toEqual(["factory", "plug"]);
    });
  });

  describe("identity and non-mutation", () => {
    it("stores the descriptor by reference — no clone, no defensive copy", () => {
      // We rely on this to keep descriptor construction O(1) and to let
      // callers compare by identity if they ever need to dedupe.
      const descriptor = makeDescriptor({ family: "shell" });
      const pkg = createResourcePackage(descriptor, async () => ({}), sentinelPlug);

      expect(tryGetResourcePackageDescriptor(pkg)).toBe(descriptor);
    });

    it("does not mutate the descriptor argument", () => {
      const descriptor = makeDescriptor({ family: "shell", isReactive: true, isVertex: false });
      const snapshot = { ...descriptor };

      createResourcePackage(descriptor, async () => ({}), sentinelPlug);

      expect(descriptor).toEqual(snapshot);
    });

    it("does not freeze the descriptor argument (freezing is the caller's choice)", () => {
      const descriptor = makeDescriptor();

      createResourcePackage(descriptor, async () => ({}), sentinelPlug);

      expect(Object.isFrozen(descriptor)).toBe(false);
    });

    it("accepts a frozen descriptor and preserves its frozen state end-to-end", () => {
      const frozen = Object.freeze(makeDescriptor({ family: "shell" }));

      const pkg = createResourcePackage(frozen, async () => ({}), sentinelPlug);
      const retrieved = tryGetResourcePackageDescriptor(pkg);

      expect(retrieved).toBe(frozen);
      expect(Object.isFrozen(retrieved)).toBe(true);
    });

    it("produces distinct package objects on every call, even with the same arguments", () => {
      // The factory must not memoize — two call sites that happen to pass the
      // same descriptor/factory/plug should still get independent packages
      // so they can be tracked, cached, or disposed independently.
      const descriptor = makeDescriptor();
      const factory = async () => ({});

      const p1 = createResourcePackage(descriptor, factory, sentinelPlug);
      const p2 = createResourcePackage(descriptor, factory, sentinelPlug);

      expect(p1).not.toBe(p2);
      // But the pieces they share are still identity-equal.
      expect(p1.factory).toBe(p2.factory);
      expect(p1.plug).toBe(p2.plug);
      expect(tryGetResourcePackageDescriptor(p1)).toBe(tryGetResourcePackageDescriptor(p2));
    });
  });

  describe("factory parameter is stored, not invoked", () => {
    it("never calls the factory at construction time", () => {
      // The factory is for lazy resolution — invoking it here would pull in
      // the resource eagerly and defeat the entire async-loading design.
      const factory = vi.fn(async () => ({ greeting: "hi" }) satisfies AnyResource);

      createResourcePackage(makeDescriptor(), factory, sentinelPlug);

      expect(factory).not.toHaveBeenCalled();
    });

    it("stores the exact factory reference (no wrapping, no binding)", () => {
      const factory = async () => ({ a: 1 }) satisfies AnyResource;
      const pkg = createResourcePackage(makeDescriptor(), factory, sentinelPlug);

      expect(pkg.factory).toBe(factory);
    });

    it("does not introspect the factory's return value at construction time", () => {
      // A factory that throws when called must not affect createResourcePackage,
      // because createResourcePackage should never call it.
      const boom = new Error("factory must not be called");
      const throwingFactory = async (): Promise<AnyResource> => {
        throw boom;
      };

      expect(() => createResourcePackage(makeDescriptor(), throwingFactory, sentinelPlug)).not.toThrow();
    });
  });
});

// --- tryGetResourcePackageDescriptor ----------------------------------------

describe("tryGetResourcePackageDescriptor", () => {
  it("returns the descriptor for a package built via createResourcePackage", () => {
    const descriptor = makeDescriptor({ family: "shell", isReactive: true, isVertex: true });
    const pkg = createResourcePackage(descriptor, async () => ({}), sentinelPlug);

    expect(tryGetResourcePackageDescriptor(pkg)).toEqual({
      family: "shell",
      isReactive: true,
      isVertex: true,
    });
  });

  it("returns the exact same reference stored at construction time (identity round-trip)", () => {
    const descriptor = makeDescriptor();
    const pkg = createResourcePackage(descriptor, async () => ({}), sentinelPlug);

    expect(tryGetResourcePackageDescriptor(pkg)).toBe(descriptor);
  });

  it("returns undefined for a plain AnyResource with no brand symbol", () => {
    const raw: AnyResource = { greeting: "hi", count: 3 };

    expect(tryGetResourcePackageDescriptor(raw)).toBeUndefined();
  });

  it("returns undefined for an empty object", () => {
    // Minimal raw resource — the symbol key is unreachable from outside this
    // module, so the guard must return undefined.
    const raw: AnyResource = {};

    expect(tryGetResourcePackageDescriptor(raw)).toBeUndefined();
  });

  it("returns undefined for a resource whose own string keys coincidentally look package-ish", () => {
    // Defensive regression: a raw resource that happens to have a `factory`
    // or `plug` property must NOT be misidentified as a package. The brand
    // symbol is the single source of truth.
    const raw: AnyResource = { factory: "not a factory", plug: "not a plug" };

    expect(tryGetResourcePackageDescriptor(raw)).toBeUndefined();
  });

  it("returns undefined for a resource carrying an unrelated symbol key", () => {
    // Another module's symbol must never be mistaken for ours.
    const otherSymbol = Symbol("other");
    const raw = { [otherSymbol]: { family: "gear" } } as unknown as AnyResource;

    expect(tryGetResourcePackageDescriptor(raw)).toBeUndefined();
  });
});

// --- integration: createResourcePackage ⇄ tryGetResourcePackageDescriptor ----

describe("createResourcePackage ⇄ tryGetResourcePackageDescriptor round-trip", () => {
  it("treats the package as assignable to AnyResourcePackage at the type level", () => {
    // Lightweight sanity check that the generic signature does not leak into
    // anything incompatible with AnyResourcePackage (the erased variant used
    // throughout the runtime).
    const pkg: AnyResourcePackage = createResourcePackage(makeDescriptor(), async () => ({}), sentinelPlug);

    expect(tryGetResourcePackageDescriptor(pkg)).toBeDefined();
  });

  it("round-trips every canonical family/flag combination without drift", () => {
    const cases: ResourcePackageDescriptor[] = [
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
      const pkg = createResourcePackage(descriptor, async () => ({}), sentinelPlug);
      expect(tryGetResourcePackageDescriptor(pkg)).toEqual(descriptor);
    }
  });
});

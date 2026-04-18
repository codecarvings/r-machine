import { describe, expect, it } from "vitest";
import type { AnyRes, ResFamily } from "../../src/core/res.js";
import { type AnyResMatrix, createResMatrix } from "../../src/core/res-matrix.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import type { AnyResPlug } from "../../src/core/res-plug.js";
import { createResPod } from "../../src/core/res-pod.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

// --- helpers -----------------------------------------------------------------

type MatrixData = { family: ResFamily; isReactive: boolean; isVertex: boolean };

// Builds a realistic matrix via the public factory. `plug` and `factory` are
// sentinel values that we later assert are never touched by
// createResPod.
function makeMatrix(data: MatrixData, resource: AnyRes = {}): AnyResMatrix {
  return createResMatrix(data, async () => resource, {} as AnyResPlug);
}

function makeMatrixModule(data: MatrixData, resource?: AnyRes): AnyResModule {
  return { r: makeMatrix(data, resource) };
}

function makeRawModule(resource: AnyRes = { greeting: "hi" }): AnyResModule {
  return { r: resource };
}

// Assert that a call produced an RMachineResolveError and surface the error
// for additional inspection. Using try/catch + expect.unreachable (preferred
// over `.toThrow` because it lets us make rich assertions on the thrown value
// while still failing the test if nothing is thrown).
function captureResolveError(fn: () => unknown): RMachineResolveError {
  try {
    fn();
    expect.unreachable("expected createResPod to throw an RMachineResolveError");
  } catch (error) {
    expect(error).toBeInstanceOf(RMachineResolveError);
    return error as RMachineResolveError;
  }
  // expect.unreachable throws, so this is unreachable — satisfies TS return.
  throw new Error("unreachable");
}

// --- tests -------------------------------------------------------------------

describe("createResPod", () => {
  describe("ResMatrix origin — happy paths", () => {
    it("produces a gear data that copies family and flags verbatim from the matrix data", () => {
      // This pins the "matrix is the source of truth for family/flags" contract.
      const module = makeMatrixModule({ family: "gear", isReactive: false, isVertex: true });

      const d = createResPod(module, "app/home", undefined, "gear");

      expect(d).toEqual({
        namespace: "app/home",
        locale: undefined,
        family: "gear",
        isReactive: false,
        isVertex: true,
        plugHead: undefined,
        originType: "res-matrix",
        origin: module.r,
      });
    });

    it("produces a shell data and carries a concrete locale through verbatim", () => {
      const module = makeMatrixModule({ family: "shell", isReactive: true, isVertex: false });

      const d = createResPod(module, "app/profile", "it-IT", "shell");

      expect(d.family).toBe("shell");
      expect(d.isReactive).toBe(true);
      expect(d.isVertex).toBe(false);
      expect(d.locale).toBe("it-IT");
      expect(d.originType).toBe("res-matrix");
      expect(d.origin).toBe(module.r);
    });

    it("accepts a shell matrix under a dynamic-shell layout (dynamic-shell maps to shell)", () => {
      // dynamic-shell is a *layout* type (how to find the path), but at the
      // family level it collapses to "shell". A shell matrix must therefore
      // be valid under this layout with no further coercion.
      const module = makeMatrixModule({ family: "shell", isReactive: true, isVertex: false });

      const d = createResPod(module, "app/live", "en-US", "dynamic-shell");

      expect(d.family).toBe("shell");
      expect(d.isReactive).toBe(true);
      expect(d.originType).toBe("res-matrix");
    });

    it.each([
      { isReactive: false, isVertex: false },
      { isReactive: true, isVertex: false },
      { isReactive: false, isVertex: true },
      { isReactive: true, isVertex: true },
    ])("propagates every (isReactive, isVertex) combination from the matrix data %j", (flags) => {
      // A table test is justified here: the function has no branching on these
      // flags, but we want to guarantee *none* is ever inverted, zeroed, or
      // cross-wired by a future refactor.
      const module = makeMatrixModule({ family: "gear", ...flags });

      const d = createResPod(module, "app", undefined, "gear");

      expect(d.isReactive).toBe(flags.isReactive);
      expect(d.isVertex).toBe(flags.isVertex);
    });
  });

  describe("ResMatrix origin — layout/family validation", () => {
    it("throws RMachineResolveError when a gear matrix is used under a shell layout", () => {
      const module = makeMatrixModule({ family: "gear", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResPod(module, "app/home", "en-US", "shell"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      // Message must name the namespace, the offending family, and the layout
      // so that the diagnostic is actionable without additional context.
      expect(error.message).toContain("app/home");
      expect(error.message).toContain('"gear"');
      expect(error.message).toContain('"shell"');
    });

    it("throws when a shell matrix is used under a gear layout (symmetric mismatch)", () => {
      // Covers the opposite direction of the mismatch table — both directions
      // must be rejected, not just one.
      const module = makeMatrixModule({ family: "shell", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResPod(module, "app/home", undefined, "gear"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"shell"');
      expect(error.message).toContain('"gear"');
    });

    it("throws when a gear matrix is used under a dynamic-shell layout (dynamic-shell collapses to shell, not gear)", () => {
      const module = makeMatrixModule({ family: "gear", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResPod(module, "app/live", undefined, "dynamic-shell"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"gear"');
      expect(error.message).toContain("dynamic-shell");
    });

    it("names the mismatch using the ORIGINAL layout string, not the collapsed family (diagnostics clarity)", () => {
      // Regression guard: a previous refactor could be tempted to report
      // "shell" when the user actually passed "dynamic-shell". The message
      // should reflect what the caller wrote, so they can find it in their
      // config.
      const module = makeMatrixModule({ family: "gear", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResPod(module, "app", undefined, "dynamic-shell"));

      expect(error.message).toContain("dynamic-shell");
      // It should NOT report a bare "shell" without the "dynamic-" prefix —
      // that would mislead the user into looking at the wrong config entry.
      // (We allow "shell" as a substring of "dynamic-shell".)
      expect(error.message.replace(/dynamic-shell/g, "")).not.toContain("shell");
    });
  });

  describe("raw AnyRes origin", () => {
    // Contract: only the "shell" layout admits a raw resource. Gear,
    // vertex-gear, and dynamic-shell all require a matrix factory — the raw
    // form has no way to carry the required brands or locale bundling.

    it("builds a shell data from a raw resource when the layout is shell, forwarding the locale", () => {
      const module = makeRawModule({ greeting: "ciao" });

      const d = createResPod(module, "app/home", "it-IT", "shell");

      expect(d.family).toBe("shell");
      expect(d.locale).toBe("it-IT");
      expect(d.originType).toBe("raw");
      expect(d.isReactive).toBe(false);
      expect(d.isVertex).toBe(false);
      expect(d.plugHead).toBeUndefined();
      expect(d.origin).toBe(module.r);
    });

    it("throws when a raw resource is used under a gear layout (matrices are required)", () => {
      const module = makeRawModule();

      const error = captureResolveError(() => createResPod(module, "app/home", undefined, "gear"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("app/home");
      expect(error.message).toContain('"gear"');
    });

    it("throws when a raw resource is used under a vertex-gear layout (matrices are required)", () => {
      const module = makeRawModule();

      const error = captureResolveError(() => createResPod(module, "app/root", undefined, "vertex-gear"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("app/root");
      expect(error.message).toContain('"vertex-gear"');
    });

    it("throws when a raw resource is used under a dynamic-shell layout (matrices are required)", () => {
      const module = makeRawModule();

      const error = captureResolveError(() => createResPod(module, "app/live", "en-US", "dynamic-shell"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("app/live");
      expect(error.message).toContain("dynamic-shell");
    });

    it("treats a plain object with no special keys as a raw resource (only valid under shell)", () => {
      // The brand symbol is module-private to res-matrix.ts, so raw
      // resources have no way to mimic a matrix. This pins the invariant:
      // anything that did not come from createResMatrix is raw. Raw is now
      // admitted only under the "shell" layout.
      const rawLikely: AnyRes = { factory: "surprise", plug: "gotcha" };

      const d = createResPod({ r: rawLikely }, "app", "en-US", "shell");

      expect(d.originType).toBe("raw");
      expect(d.family).toBe("shell");
      expect(d.origin).toBe(rawLikely);
    });
  });

  describe("identity, purity, and isolation", () => {
    it("preserves the exact `origin` reference for matrices (no cloning, no proxy wrapping)", () => {
      const mat = makeMatrix({ family: "gear", isReactive: false, isVertex: false });

      const d = createResPod({ r: mat }, "app", undefined, "gear");

      expect(d.origin).toBe(mat);
    });

    it("preserves the exact `origin` reference for raw resources", () => {
      const resource: AnyRes = { a: 1, nested: { b: 2 } };

      const d = createResPod({ r: resource }, "app", "en-US", "shell");

      expect(d.origin).toBe(resource);
    });

    it("returns a fresh data object per call (no memoization of the result)", () => {
      const module = makeRawModule();

      const d1 = createResPod(module, "app", "en-US", "shell");
      const d2 = createResPod(module, "app", "en-US", "shell");

      expect(d1).not.toBe(d2);
      expect(d1).toEqual(d2);
    });

    it("does not read the matrix's `factory` — it stays untouched until resolution time", () => {
      // The factory is expensive (may do network/disk IO); reading it here
      // would break the invariant that data construction is pure and
      // synchronous. We enforce this by replacing it with a getter that
      // throws on access, AFTER the matrix is built via the public factory.
      // `plug` IS read on purpose (plugHead is extracted from it), so it
      // is not part of this invariant.
      const mat = createResMatrix(
        { family: "gear", isReactive: false, isVertex: false },
        async () => ({}),
        {} as AnyResPlug
      );
      Object.defineProperty(mat, "factory", {
        get() {
          throw new Error("factory must not be read during data construction");
        },
      });

      expect(() => createResPod({ r: mat }, "app", undefined, "gear")).not.toThrow();
    });

    it("does not mutate the matrix data object that was passed to createResMatrix", () => {
      const data: MatrixData = { family: "shell", isReactive: true, isVertex: false };
      const frozen = Object.freeze({ ...data });
      const mat = createResMatrix(frozen, async () => ({}), {} as AnyResPlug);

      const d = createResPod({ r: mat }, "app", "en-US", "shell");

      // Frozen source is still frozen; values still match; d's values are
      // decoupled copies, so they can coexist.
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen).toEqual({ family: "shell", isReactive: true, isVertex: false });
      expect(d.family).toBe("shell");
    });

    it("does not mutate the module envelope", () => {
      const raw: AnyRes = { a: 1 };
      const module: AnyResModule = Object.freeze({ r: raw });

      const d = createResPod(module, "app", "en-US", "shell");

      expect(Object.isFrozen(module)).toBe(true);
      expect(module.r).toBe(raw);
      expect(d.origin).toBe(raw);
    });

    it("builds distinct data objects from the same module when called with different (namespace, locale, layout)", () => {
      // The same loaded module can legitimately be described under multiple
      // contexts (e.g. the same shell under two locales). Each call should
      // produce an independent data object that still points at the shared
      // origin — critical for any caching layer built on top.
      const mat = makeMatrix({ family: "shell", isReactive: false, isVertex: false });
      const module: AnyResModule = { r: mat };

      const dIt = createResPod(module, "app", "it-IT", "shell");
      const dEn = createResPod(module, "app", "en-US", "shell");

      expect(dIt.origin).toBe(mat);
      expect(dEn.origin).toBe(mat);
      expect(dIt).not.toBe(dEn);
      expect(dIt.locale).toBe("it-IT");
      expect(dEn.locale).toBe("en-US");
    });
  });

  describe("argument forwarding edge cases", () => {
    it("forwards the namespace verbatim, including nested slash paths and non-ASCII characters", () => {
      const module = makeRawModule();
      const ns = "app/settings/profile/日本語";

      const d = createResPod(module, ns, "en-US", "shell");

      expect(d.namespace).toBe(ns);
    });

    it("forwards the empty string as a valid namespace — no coercion or normalisation", () => {
      // The function should not editorialise: validation is the caller's job.
      const module = makeRawModule();

      const d = createResPod(module, "", "en-US", "shell");

      expect(d.namespace).toBe("");
    });

    it("forwards every locale string verbatim, including BCP-47 variants", () => {
      const module = makeMatrixModule({ family: "shell", isReactive: false, isVertex: false });

      for (const locale of ["en-US", "it-IT", "en-US-POSIX", "zh-Hant-TW", ""]) {
        const d = createResPod(module, "app", locale, "shell");
        expect(d.locale).toBe(locale);
      }
    });

    it("throws synchronously — callers must not `await` the result", () => {
      // The function is sync by signature; a future refactor must not turn
      // the throw into a rejected promise or a deferred error.
      const module = makeRawModule();
      let threw = false;
      try {
        createResPod(module, "app", undefined, "dynamic-shell");
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });
});

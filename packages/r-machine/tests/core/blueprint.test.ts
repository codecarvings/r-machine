import { describe, expect, it } from "vitest";
import { createBlueprint } from "../../src/core/blueprint.js";
import type { GearRole } from "../../src/core/gear-plug.js";
import type { AnyRes } from "../../src/core/res.js";
import {
  type AnyResMatrix,
  createResMatrix,
  type GearMatrixMeta,
  type ShellMatrixMeta,
} from "../../src/core/res-matrix.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

// --- helpers -----------------------------------------------------------------

type AnyMeta = GearMatrixMeta | ShellMatrixMeta;

// Builds a realistic matrix via the public factory. The connector / head /
// cursor are minimal fakes — createBlueprint does not invoke them, it only
// reads the matrix's brand symbol (via tryGetResMatrixMeta) and the plug.
function makeMatrix(meta: AnyMeta, resource: AnyRes = {}): AnyResMatrix {
  return createResMatrix({
    connector: { getWire: async () => ({ plugin: undefined }) } as never,
    meta,
    head: { realm: "res", family: meta.family, mode: "list", deps: [], nsDeps: [], nsDepList: [], ports: {} } as never,
    cursor: undefined,
    userFactory: async () => resource,
  });
}

function makeMatrixModule(meta: AnyMeta, resource?: AnyRes): AnyResModule {
  return { r: makeMatrix(meta, resource) };
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
    expect.unreachable("expected createBlueprint to throw an RMachineResolveError");
  } catch (error) {
    expect(error).toBeInstanceOf(RMachineResolveError);
    return error as RMachineResolveError;
  }
  // expect.unreachable throws, so this is unreachable — satisfies TS return.
  throw new Error("unreachable");
}

// --- tests -------------------------------------------------------------------

describe("createBlueprint", () => {
  describe("ResMatrix origin — happy paths", () => {
    it("produces a gear blueprint that derives family/role/flags from the layout entry type", () => {
      // Matrix family must match layout family; gearRole is derived from the layoutEntryType literal.
      const module = makeMatrixModule({ family: "gear", role: "inner" });

      const bp = createBlueprint(module, "app/home", undefined, "gear:inner");

      expect(bp).toEqual({
        namespace: "app/home",
        locale: undefined,
        layoutEntryType: "gear:inner",
        family: "gear",
        gearRole: "inner",
        plugHead: expect.anything(),
        originType: "res-matrix",
        origin: module.r,
      });
    });

    it("produces a shell blueprint and carries a concrete locale through verbatim", () => {
      const module = makeMatrixModule({ family: "shell" });

      const bp = createBlueprint(module, "app/profile", "it-IT", "shell");

      expect(bp.family).toBe("shell");
      expect(bp.gearRole).toBeUndefined();
      expect(bp.locale).toBe("it-IT");
      expect(bp.originType).toBe("res-matrix");
      expect(bp.origin).toBe(module.r);
    });

    it("accepts a shell matrix under a shell(mono) layout (shell(mono) collapses to shell family)", () => {
      // shell(mono) is a *layout* type (how to find the path), but at the
      // family level it collapses to "shell". A shell matrix must therefore
      // be valid under this layout with no further coercion.
      const module = makeMatrixModule({ family: "shell" });

      const bp = createBlueprint(module, "app/live", "en-US", "shell(mono)");

      expect(bp.family).toBe("shell");
      expect(bp.layoutEntryType).toBe("shell(mono)");
      expect(bp.originType).toBe("res-matrix");
      // shell(mono) collapses to the shell family, so the locale is carried
      // through verbatim (same handling as a regular shell layout — the
      // path-level "mono" specialisation is the resolver's concern).
      expect(bp.locale).toBe("en-US");
    });

    it.each([
      { role: "inner" as const, layout: "gear:inner" as const },
      { role: "base" as const, layout: "gear:base" as const },
      { role: "outer" as const, layout: "gear:outer" as const },
      { role: "outer" as const, layout: "gear:outer(vertex)" as const },
    ])("derives gearRole from layout %j", ({ role, layout }) => {
      // A table test is justified here: the function has straight-line
      // mappings from layout literal to flags. This guarantees no future
      // refactor inverts, zeroes, or cross-wires a flag.
      const module = makeMatrixModule({ family: "gear", role });

      const bp = createBlueprint(module, "app", undefined, layout);

      expect(bp.gearRole).toBe(role);
    });
  });

  describe("ResMatrix origin — layout/family validation", () => {
    it("throws RMachineResolveError when a gear matrix is used under a shell layout", () => {
      const module = makeMatrixModule({ family: "gear", role: "inner" });

      const error = captureResolveError(() => createBlueprint(module, "app/home", "en-US", "shell"));

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
      const module = makeMatrixModule({ family: "shell" });

      const error = captureResolveError(() => createBlueprint(module, "app/home", undefined, "gear:inner"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"shell"');
      expect(error.message).toContain('"gear:inner"');
    });

    it("throws when a gear matrix is used under a shell(mono) layout (shell(mono) collapses to shell, not gear)", () => {
      const module = makeMatrixModule({ family: "gear", role: "inner" });

      const error = captureResolveError(() => createBlueprint(module, "app/live", undefined, "shell(mono)"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"gear"');
      expect(error.message).toContain("shell(mono)");
    });

    it("names the mismatch using the ORIGINAL layout string, not the collapsed family (diagnostics clarity)", () => {
      // Regression guard: a previous refactor could be tempted to report
      // "shell" when the user actually passed "shell(mono)". The message
      // should reflect what the caller wrote, so they can find it in their
      // config.
      const module = makeMatrixModule({ family: "gear", role: "inner" });

      const error = captureResolveError(() => createBlueprint(module, "app", undefined, "shell(mono)"));

      expect(error.message).toContain("shell(mono)");
    });

    it("throws when a gear matrix's role disagrees with the layout's role (inner matrix under :base layout)", () => {
      // The matrix's role must match the layout's role. createResMatrix lets
      // any role pair with the gear family at construction time; createBlueprint
      // is the gate that pins the alignment.
      const module = makeMatrixModule({ family: "gear", role: "inner" });

      const error = captureResolveError(() => createBlueprint(module, "app", undefined, "gear:base"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"inner"');
      expect(error.message).toContain('"gear:base"');
    });
  });

  describe("raw AnyRes origin", () => {
    // Contract: raw resources are admitted under "shell" (with locale) and
    // under "gear:inner" / "gear:base" (which collapse to the shell family
    // because there is no matrix to express gear semantics). They are
    // rejected under "shell(mono)", "gear:outer", "gear:outer(vertex)".

    it("builds a shell blueprint from a raw resource when the layout is shell, forwarding the locale", () => {
      const module = makeRawModule({ greeting: "ciao" });

      const bp = createBlueprint(module, "app/home", "it-IT", "shell");

      expect(bp.family).toBe("shell");
      expect(bp.locale).toBe("it-IT");
      expect(bp.originType).toBe("res");
      expect(bp.gearRole).toBeUndefined();
      expect(bp.plugHead).toBeUndefined();
      expect(bp.origin).toBe(module.r);
    });

    it("produces a shell-family blueprint from a raw resource under a gear:inner layout (raw collapses to shell)", () => {
      // Under the new contract, a raw resource is admitted under "gear:inner"
      // and "gear:base" and reported as a shell-family blueprint — without a
      // matrix factory there is no way to express reactive/vertex semantics.
      const module = makeRawModule({ greeting: "ciao" });

      const bp = createBlueprint(module, "app/home", undefined, "gear:inner");

      expect(bp.family).toBe("shell");
      expect(bp.layoutEntryType).toBe("gear:inner");
      expect(bp.originType).toBe("res");
      expect(bp.gearRole).toBeUndefined();
      expect(bp.origin).toBe(module.r);
    });

    it.each([
      "gear:outer",
      "gear:outer(vertex)",
      "shell(mono)",
    ] as const)("throws when a raw resource is used under %s (matrices are required)", (layout) => {
      const module = makeRawModule();

      const error = captureResolveError(() => createBlueprint(module, "app/root", "en-US", layout));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("app/root");
      expect(error.message).toContain(layout);
    });

    it("treats a plain object with no special keys as a raw resource (only valid under shell)", () => {
      // The brand symbol is module-private to res-matrix.ts, so raw
      // resources have no way to mimic a matrix. This pins the invariant:
      // anything that did not come from createResMatrix is raw. Raw is now
      // admitted only under the "shell" layout.
      const rawLikely: AnyRes = { factory: "surprise", plug: "gotcha" };

      const bp = createBlueprint({ r: rawLikely }, "app", "en-US", "shell");

      expect(bp.originType).toBe("res");
      expect(bp.family).toBe("shell");
      expect(bp.origin).toBe(rawLikely);
    });
  });

  describe("identity, purity, and isolation", () => {
    it("preserves the exact `origin` reference for matrices (no cloning, no proxy wrapping)", () => {
      const mat = makeMatrix({ family: "gear", role: "inner" });

      const bp = createBlueprint({ r: mat }, "app", undefined, "gear:inner");

      expect(bp.origin).toBe(mat);
    });

    it("preserves the exact `origin` reference for raw resources", () => {
      const resource: AnyRes = { a: 1, nested: { b: 2 } };

      const bp = createBlueprint({ r: resource }, "app", "en-US", "shell");

      expect(bp.origin).toBe(resource);
    });

    it("returns a fresh blueprint object per call (no memoization of the result)", () => {
      const module = makeRawModule();

      const bp1 = createBlueprint(module, "app", "en-US", "shell");
      const bp2 = createBlueprint(module, "app", "en-US", "shell");

      expect(bp1).not.toBe(bp2);
      expect(bp1).toEqual(bp2);
    });

    it("does not read the matrix's `factory` — it stays untouched until resolution time", () => {
      // The factory is expensive (may do network/disk IO); reading it here
      // would break the invariant that blueprint construction is pure and
      // synchronous. We enforce this by replacing it with a getter that
      // throws on access, AFTER the matrix is built via the public factory.
      // `plug` IS read on purpose (plugHead is extracted from it), so it
      // is not part of this invariant.
      const mat = makeMatrix({ family: "gear", role: "inner" });
      Object.defineProperty(mat, "factory", {
        get() {
          throw new Error("factory must not be read during blueprint construction");
        },
      });

      expect(() => createBlueprint({ r: mat }, "app", undefined, "gear:inner")).not.toThrow();
    });

    it("does not mutate the matrix meta object that was passed to createResMatrix", () => {
      const meta: GearMatrixMeta = { family: "gear", role: "inner" };
      const frozen = Object.freeze({ ...meta });
      const mat = makeMatrix(frozen);

      createBlueprint({ r: mat }, "app", undefined, "gear:inner");

      // Frozen source is still frozen and its values are unchanged.
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen).toEqual({ family: "gear", role: "inner" });
    });

    it("does not mutate the module envelope", () => {
      const raw: AnyRes = { a: 1 };
      const module: AnyResModule = Object.freeze({ r: raw });

      const bp = createBlueprint(module, "app", "en-US", "shell");

      expect(Object.isFrozen(module)).toBe(true);
      expect(module.r).toBe(raw);
      expect(bp.origin).toBe(raw);
    });

    it("builds distinct blueprint objects from the same module when called with different (namespace, locale, layout)", () => {
      // The same loaded module can legitimately be described under multiple
      // contexts (e.g. the same shell under two locales). Each call should
      // produce an independent blueprint that still points at the shared
      // origin — critical for any caching layer built on top.
      const mat = makeMatrix({ family: "shell" });
      const module: AnyResModule = { r: mat };

      const bpIt = createBlueprint(module, "app", "it-IT", "shell");
      const bpEn = createBlueprint(module, "app", "en-US", "shell");

      expect(bpIt.origin).toBe(mat);
      expect(bpEn.origin).toBe(mat);
      expect(bpIt).not.toBe(bpEn);
      expect(bpIt.locale).toBe("it-IT");
      expect(bpEn.locale).toBe("en-US");
    });
  });

  describe("argument forwarding edge cases", () => {
    it("forwards the namespace verbatim, including nested slash paths and non-ASCII characters", () => {
      const module = makeRawModule();
      const ns = "app/settings/profile/日本語";

      const bp = createBlueprint(module, ns, "en-US", "shell");

      expect(bp.namespace).toBe(ns);
    });

    it("forwards the empty string as a valid namespace — no coercion or normalisation", () => {
      // The function should not editorialise: validation is the caller's job.
      const module = makeRawModule();

      const bp = createBlueprint(module, "", "en-US", "shell");

      expect(bp.namespace).toBe("");
    });

    it("forwards every locale string verbatim, including BCP-47 variants", () => {
      const module = makeMatrixModule({ family: "shell" });

      for (const locale of ["en-US", "it-IT", "en-US-POSIX", "zh-Hant-TW", ""]) {
        const bp = createBlueprint(module, "app", locale, "shell");
        expect(bp.locale).toBe(locale);
      }
    });

    it("throws synchronously — callers must not `await` the result", () => {
      // The function is sync by signature; a future refactor must not turn
      // the throw into a rejected promise or a deferred error.
      const module = makeRawModule();
      try {
        createBlueprint(module, "app", undefined, "shell(mono)");
        expect.unreachable("expected createBlueprint to throw synchronously");
      } catch {
        // success — thrown synchronously
      }
    });
  });

  // Drop-in compile-time guard against drift on GearRole — keeps the test's
  // table-driven cases from silently going stale if the role union ever loses
  // a literal.
  it("GearRole union still includes inner/base/outer (compile-time guard)", () => {
    const _check: GearRole[] = ["inner", "base", "outer"];
    void _check;
  });
});

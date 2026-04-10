import { describe, expect, it } from "vitest";
import type { AnyModule } from "../../src/core/module.js";
import type { AnyResource, ResourceFamily } from "../../src/core/resource.js";
import { createResourceDescriptor } from "../../src/core/resource-descriptor.js";
import { type AnyResourcePackage, createResourcePackage } from "../../src/core/resource-package.js";
import type { AnyResourcePlug } from "../../src/core/resource-plug.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

// --- helpers -----------------------------------------------------------------

type PackageDescriptor = { family: ResourceFamily; isReactive: boolean; isVertex: boolean };

// Builds a realistic package via the public factory. `plug` and `factory` are
// sentinel values that we later assert are never touched by
// createResourceDescriptor.
function makePackage(descriptor: PackageDescriptor, resource: AnyResource = {}): AnyResourcePackage {
  return createResourcePackage(descriptor, async () => resource, {} as AnyResourcePlug);
}

function makePackageModule(descriptor: PackageDescriptor, resource?: AnyResource): AnyModule {
  return { r: makePackage(descriptor, resource) };
}

function makeRawModule(resource: AnyResource = { greeting: "hi" }): AnyModule {
  return { r: resource };
}

// Assert that a call produced an RMachineResolveError and surface the error
// for additional inspection. Using try/catch + expect.unreachable (preferred
// over `.toThrow` because it lets us make rich assertions on the thrown value
// while still failing the test if nothing is thrown).
function captureResolveError(fn: () => unknown): RMachineResolveError {
  try {
    fn();
    expect.unreachable("expected createResourceDescriptor to throw an RMachineResolveError");
  } catch (error) {
    expect(error).toBeInstanceOf(RMachineResolveError);
    return error as RMachineResolveError;
  }
  // expect.unreachable throws, so this is unreachable — satisfies TS return.
  throw new Error("unreachable");
}

// --- tests -------------------------------------------------------------------

describe("createResourceDescriptor", () => {
  describe("ResourcePackage origin — happy paths", () => {
    it("produces a gear descriptor that copies family and flags verbatim from the package descriptor", () => {
      // This pins the "package is the source of truth for family/flags" contract.
      const module = makePackageModule({ family: "gear", isReactive: false, isVertex: true });

      const d = createResourceDescriptor(module, "app/home", undefined, "gear");

      expect(d).toEqual({
        namespace: "app/home",
        locale: undefined,
        family: "gear",
        isReactive: false,
        isVertex: true,
        deps: [],
        originType: "resource-package",
        origin: module.r,
      });
    });

    it("produces a shell descriptor and carries a concrete locale through verbatim", () => {
      const module = makePackageModule({ family: "shell", isReactive: true, isVertex: false });

      const d = createResourceDescriptor(module, "app/profile", "it-IT", "shell");

      expect(d.family).toBe("shell");
      expect(d.isReactive).toBe(true);
      expect(d.isVertex).toBe(false);
      expect(d.locale).toBe("it-IT");
      expect(d.originType).toBe("resource-package");
      expect(d.origin).toBe(module.r);
    });

    it("accepts a shell package under a dynamic-shell layout (dynamic-shell maps to shell)", () => {
      // dynamic-shell is a *layout* type (how to find the path), but at the
      // family level it collapses to "shell". A shell package must therefore
      // be valid under this layout with no further coercion.
      const module = makePackageModule({ family: "shell", isReactive: true, isVertex: false });

      const d = createResourceDescriptor(module, "app/live", "en-US", "dynamic-shell");

      expect(d.family).toBe("shell");
      expect(d.isReactive).toBe(true);
      expect(d.originType).toBe("resource-package");
    });

    it.each([
      { isReactive: false, isVertex: false },
      { isReactive: true, isVertex: false },
      { isReactive: false, isVertex: true },
      { isReactive: true, isVertex: true },
    ])("propagates every (isReactive, isVertex) combination from the package descriptor %j", (flags) => {
      // A table test is justified here: the function has no branching on these
      // flags, but we want to guarantee *none* is ever inverted, zeroed, or
      // cross-wired by a future refactor.
      const module = makePackageModule({ family: "gear", ...flags });

      const d = createResourceDescriptor(module, "app", undefined, "gear");

      expect(d.isReactive).toBe(flags.isReactive);
      expect(d.isVertex).toBe(flags.isVertex);
    });
  });

  describe("ResourcePackage origin — layout/family validation", () => {
    it("throws RMachineResolveError when a gear package is used under a shell layout", () => {
      const module = makePackageModule({ family: "gear", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResourceDescriptor(module, "app/home", "en-US", "shell"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      // Message must name the namespace, the offending family, and the layout
      // so that the diagnostic is actionable without additional context.
      expect(error.message).toContain("app/home");
      expect(error.message).toContain('"gear"');
      expect(error.message).toContain('"shell"');
    });

    it("throws when a shell package is used under a gear layout (symmetric mismatch)", () => {
      // Covers the opposite direction of the mismatch matrix — both directions
      // must be rejected, not just one.
      const module = makePackageModule({ family: "shell", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResourceDescriptor(module, "app/home", undefined, "gear"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"shell"');
      expect(error.message).toContain('"gear"');
    });

    it("throws when a gear package is used under a dynamic-shell layout (dynamic-shell collapses to shell, not gear)", () => {
      const module = makePackageModule({ family: "gear", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResourceDescriptor(module, "app/live", undefined, "dynamic-shell"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"gear"');
      expect(error.message).toContain("dynamic-shell");
    });

    it("names the mismatch using the ORIGINAL layout string, not the collapsed family (diagnostics clarity)", () => {
      // Regression guard: a previous refactor could be tempted to report
      // "shell" when the user actually passed "dynamic-shell". The message
      // should reflect what the caller wrote, so they can find it in their
      // config.
      const module = makePackageModule({ family: "gear", isReactive: false, isVertex: false });

      const error = captureResolveError(() => createResourceDescriptor(module, "app", undefined, "dynamic-shell"));

      expect(error.message).toContain("dynamic-shell");
      // It should NOT report a bare "shell" without the "dynamic-" prefix —
      // that would mislead the user into looking at the wrong config entry.
      // (We allow "shell" as a substring of "dynamic-shell".)
      expect(error.message.replace(/dynamic-shell/g, "")).not.toContain("shell");
    });
  });

  describe("raw AnyResource origin", () => {
    it("builds a gear descriptor from a raw resource with default static flags and empty deps", () => {
      const module = makeRawModule({ greeting: "hi" });

      const d = createResourceDescriptor(module, "app/home", undefined, "gear");

      expect(d).toEqual({
        namespace: "app/home",
        locale: undefined,
        family: "gear",
        isReactive: false,
        isVertex: false,
        deps: [],
        originType: "resource",
        origin: module.r,
      });
    });

    it("builds a shell descriptor from a raw resource when the layout is shell, forwarding the locale", () => {
      const module = makeRawModule({ greeting: "ciao" });

      const d = createResourceDescriptor(module, "app/home", "it-IT", "shell");

      expect(d.family).toBe("shell");
      expect(d.locale).toBe("it-IT");
      expect(d.originType).toBe("resource");
      expect(d.isReactive).toBe(false);
      expect(d.isVertex).toBe(false);
      expect(d.deps).toEqual([]);
      expect(d.origin).toBe(module.r);
    });

    it("throws when a raw resource is used under a dynamic-shell layout (packages are required)", () => {
      const module = makeRawModule();

      const error = captureResolveError(() => createResourceDescriptor(module, "app/live", "en-US", "dynamic-shell"));

      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain("app/live");
      expect(error.message).toContain("dynamic-shell");
    });

    it("treats a plain object with no special keys as a raw resource", () => {
      // The brand symbol is module-private to resource-package.ts, so raw
      // resources have no way to mimic a package. This pins the invariant:
      // anything that did not come from createResourcePackage is raw.
      const rawLikely: AnyResource = { factory: "surprise", plug: "gotcha" };

      const d = createResourceDescriptor({ r: rawLikely }, "app", undefined, "gear");

      expect(d.originType).toBe("resource");
      expect(d.family).toBe("gear");
      expect(d.origin).toBe(rawLikely);
    });
  });

  describe("identity, purity, and isolation", () => {
    it("preserves the exact `origin` reference for packages (no cloning, no proxy wrapping)", () => {
      const pkg = makePackage({ family: "gear", isReactive: false, isVertex: false });

      const d = createResourceDescriptor({ r: pkg }, "app", undefined, "gear");

      expect(d.origin).toBe(pkg);
    });

    it("preserves the exact `origin` reference for raw resources", () => {
      const resource: AnyResource = { a: 1, nested: { b: 2 } };

      const d = createResourceDescriptor({ r: resource }, "app", undefined, "gear");

      expect(d.origin).toBe(resource);
    });

    it("returns a fresh descriptor object per call (no memoization of the result)", () => {
      const module = makeRawModule();

      const d1 = createResourceDescriptor(module, "app", undefined, "gear");
      const d2 = createResourceDescriptor(module, "app", undefined, "gear");

      expect(d1).not.toBe(d2);
      expect(d1).toEqual(d2);
    });

    it("returns a fresh `deps` array per call so that caller-side mutation cannot leak between descriptors", () => {
      // The TODO notes that `deps` will eventually be extracted from the plug;
      // until then, a shared-reference bug would be silent but dangerous. This
      // test fails as soon as someone inadvertently introduces a module-level
      // constant and reuses it.
      const module = makeRawModule();

      const d1 = createResourceDescriptor(module, "app", undefined, "gear");
      const d2 = createResourceDescriptor(module, "app", undefined, "gear");

      expect(d1.deps).not.toBe(d2.deps);
      d1.deps.push("leak");
      expect(d2.deps).toEqual([]);
    });

    it("does not read the package's `factory` or `plug` — only the package descriptor is consulted", () => {
      // The factory is expensive (may do network/disk IO); reading it here
      // would break the invariant that descriptor construction is pure and
      // synchronous. `plug` is similarly not yet used. We enforce both by
      // replacing both fields with getters that throw on access, AFTER the
      // package is built via the public factory.
      const pkg = createResourcePackage(
        { family: "gear", isReactive: false, isVertex: false },
        async () => ({}),
        {} as AnyResourcePlug
      );
      Object.defineProperty(pkg, "factory", {
        get() {
          throw new Error("factory must not be read during descriptor construction");
        },
      });
      Object.defineProperty(pkg, "plug", {
        get() {
          throw new Error("plug must not be read during descriptor construction");
        },
      });

      expect(() => createResourceDescriptor({ r: pkg }, "app", undefined, "gear")).not.toThrow();
    });

    it("does not mutate the package descriptor object that was passed to createResourcePackage", () => {
      const descriptor: PackageDescriptor = { family: "shell", isReactive: true, isVertex: false };
      const frozen = Object.freeze({ ...descriptor });
      const pkg = createResourcePackage(frozen, async () => ({}), {} as AnyResourcePlug);

      const d = createResourceDescriptor({ r: pkg }, "app", "en-US", "shell");

      // Frozen source is still frozen; values still match; d's values are
      // decoupled copies, so they can coexist.
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen).toEqual({ family: "shell", isReactive: true, isVertex: false });
      expect(d.family).toBe("shell");
    });

    it("does not mutate the module envelope", () => {
      const raw: AnyResource = { a: 1 };
      const module: AnyModule = Object.freeze({ r: raw });

      const d = createResourceDescriptor(module, "app", undefined, "gear");

      expect(Object.isFrozen(module)).toBe(true);
      expect(module.r).toBe(raw);
      expect(d.origin).toBe(raw);
    });

    it("builds distinct descriptors from the same module when called with different (namespace, locale, layout)", () => {
      // The same loaded module can legitimately be described under multiple
      // contexts (e.g. the same shell under two locales). Each call should
      // produce an independent descriptor that still points at the shared
      // origin — critical for any caching layer built on top.
      const pkg = makePackage({ family: "shell", isReactive: false, isVertex: false });
      const module: AnyModule = { r: pkg };

      const dIt = createResourceDescriptor(module, "app", "it-IT", "shell");
      const dEn = createResourceDescriptor(module, "app", "en-US", "shell");

      expect(dIt.origin).toBe(pkg);
      expect(dEn.origin).toBe(pkg);
      expect(dIt).not.toBe(dEn);
      expect(dIt.locale).toBe("it-IT");
      expect(dEn.locale).toBe("en-US");
    });
  });

  describe("argument forwarding edge cases", () => {
    it("forwards the namespace verbatim, including nested slash paths and non-ASCII characters", () => {
      const module = makeRawModule();
      const ns = "app/settings/profile/日本語";

      const d = createResourceDescriptor(module, ns, undefined, "gear");

      expect(d.namespace).toBe(ns);
    });

    it("forwards the empty string as a valid namespace — no coercion or normalisation", () => {
      // The function should not editorialise: validation is the caller's job.
      const module = makeRawModule();

      const d = createResourceDescriptor(module, "", undefined, "gear");

      expect(d.namespace).toBe("");
    });

    it("forwards every locale string verbatim, including BCP-47 variants", () => {
      const module = makePackageModule({ family: "shell", isReactive: false, isVertex: false });

      for (const locale of ["en-US", "it-IT", "en-US-POSIX", "zh-Hant-TW", ""]) {
        const d = createResourceDescriptor(module, "app", locale, "shell");
        expect(d.locale).toBe(locale);
      }
    });

    it("throws synchronously — callers must not `await` the result", () => {
      // The function is sync by signature; a future refactor must not turn
      // the throw into a rejected promise or a deferred error.
      const module = makeRawModule();
      let threw = false;
      try {
        createResourceDescriptor(module, "app", undefined, "dynamic-shell");
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });
});

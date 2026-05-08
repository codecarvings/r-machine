import { describe, expect, it } from "vitest";
import {
  type AnyResLayout,
  getGearRoleFromLayoutType,
  getResFamilyFromLayoutType,
  isOuterGearLayoutType,
  isVertexGearLayoutType,
  ResLayoutResolver,
} from "../../src/core/res-layout.js";
import { ERR_RESOLVE_FAILED } from "../../src/errors/error-codes.js";
import { RMachineResolveError } from "../../src/errors/r-machine-resolve-error.js";

// --- helpers -----------------------------------------------------------------

function captureResolveError(fn: () => void): RMachineResolveError {
  try {
    fn();
    expect.unreachable("expected RMachineResolveError to be thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(RMachineResolveError);
    return error as RMachineResolveError;
  }
  // unreachable per the assertion above; keeps TS happy.
  throw new Error("unreachable");
}

// --- ResLayoutResolver — resolveLayoutEntryType ------------------------------

describe("ResLayoutResolver — resolveLayoutEntryType", () => {
  describe("exact-match semantics", () => {
    it("resolves when the namespace equals a registered prefix's base (prefix without trailing '/')", () => {
      const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
      expect(resolver.resolveLayoutEntryType("app")).toBe("gear:inner");
    });

    it("throws RMachineResolveError when no prefix matches", () => {
      const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
      const error = captureResolveError(() => resolver.resolveLayoutEntryType("other"));
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"other"');
    });

    it("throws for an empty layout regardless of namespace", () => {
      const resolver = new ResLayoutResolver({});
      captureResolveError(() => resolver.resolveLayoutEntryType(""));
      captureResolveError(() => resolver.resolveLayoutEntryType("anything"));
      captureResolveError(() => resolver.resolveLayoutEntryType("a/b/c"));
    });
  });

  describe("path-boundary prefix matching", () => {
    it("matches a child namespace only at a '/' boundary", () => {
      const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
      expect(resolver.resolveLayoutEntryType("app/home")).toBe("gear:inner");
      expect(resolver.resolveLayoutEntryType("app/deeply/nested/key")).toBe("gear:inner");
    });

    it("does not treat a longer namespace that merely starts with the prefix's base as a match", () => {
      // Classic boundary bug: "app/" must NOT match "application".
      const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
      captureResolveError(() => resolver.resolveLayoutEntryType("application"));
      captureResolveError(() => resolver.resolveLayoutEntryType("apps"));
      captureResolveError(() => resolver.resolveLayoutEntryType("app-extra"));
    });

    it("does not match when the namespace is strictly shorter than the prefix's base", () => {
      const resolver = new ResLayoutResolver({ "app/home/": "gear:inner" });
      captureResolveError(() => resolver.resolveLayoutEntryType("app"));
      captureResolveError(() => resolver.resolveLayoutEntryType("app/hom"));
    });

    it("requires the character immediately after the prefix's base to be '/', not any other separator", () => {
      const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
      captureResolveError(() => resolver.resolveLayoutEntryType("app.home"));
      captureResolveError(() => resolver.resolveLayoutEntryType("app:home"));
      captureResolveError(() => resolver.resolveLayoutEntryType("app_home"));
    });
  });

  describe("longest-prefix-wins precedence", () => {
    it("picks the most specific (longest) matching prefix over a shorter one", () => {
      const resolver = new ResLayoutResolver({
        "app/": "gear:inner",
        "app/settings/": "shell",
      });
      expect(resolver.resolveLayoutEntryType("app/settings")).toBe("shell");
      expect(resolver.resolveLayoutEntryType("app/settings/theme")).toBe("shell");
      expect(resolver.resolveLayoutEntryType("app/home")).toBe("gear:inner");
    });

    it("is independent of the declaration order in the input object", () => {
      const shortFirst = new ResLayoutResolver({
        "app/": "gear:inner",
        "app/settings/": "shell",
      });
      const longFirst = new ResLayoutResolver({
        "app/settings/": "shell",
        "app/": "gear:inner",
      });
      for (const ns of ["app", "app/home", "app/settings", "app/settings/theme"]) {
        expect(shortFirst.resolveLayoutEntryType(ns)).toBe(longFirst.resolveLayoutEntryType(ns));
      }
    });

    it("selects the deepest prefix across three overlapping levels", () => {
      const resolver = new ResLayoutResolver({
        "a/": "gear:inner",
        "a/b/": "shell",
        "a/b/c/": "shell(mono)",
      });
      expect(resolver.resolveLayoutEntryType("a")).toBe("gear:inner");
      expect(resolver.resolveLayoutEntryType("a/x")).toBe("gear:inner");
      expect(resolver.resolveLayoutEntryType("a/b")).toBe("shell");
      expect(resolver.resolveLayoutEntryType("a/b/x")).toBe("shell");
      expect(resolver.resolveLayoutEntryType("a/b/c")).toBe("shell(mono)");
      expect(resolver.resolveLayoutEntryType("a/b/c/x")).toBe("shell(mono)");
    });
  });

  describe("layout-type coverage", () => {
    it("returns each canonical layout type verbatim", () => {
      const resolver = new ResLayoutResolver({
        "i/": "gear:inner",
        "b/": "gear:base",
        "o/": "gear:outer",
        "v/": "gear:outer(vertex)",
        "s/": "shell",
        "m/": "shell(mono)",
      });
      expect(resolver.resolveLayoutEntryType("i")).toBe("gear:inner");
      expect(resolver.resolveLayoutEntryType("b")).toBe("gear:base");
      expect(resolver.resolveLayoutEntryType("o")).toBe("gear:outer");
      expect(resolver.resolveLayoutEntryType("v")).toBe("gear:outer(vertex)");
      expect(resolver.resolveLayoutEntryType("s")).toBe("shell");
      expect(resolver.resolveLayoutEntryType("m")).toBe("shell(mono)");
    });
  });

  describe("input-snapshot semantics", () => {
    it("ignores mutations to the layout object performed after resolver creation", () => {
      const layout: AnyResLayout = { "app/": "gear:inner" };
      const resolver = new ResLayoutResolver(layout);

      // Mutate input after creation.
      (layout as Record<`${string}/`, string>)["app/"] = "shell";
      (layout as Record<`${string}/`, string>)["extra/"] = "shell(mono)";
      delete (layout as Record<`${string}/`, string>)["app/"];

      // Resolver behavior stays pinned to the original snapshot.
      expect(resolver.resolveLayoutEntryType("app")).toBe("gear:inner");
      captureResolveError(() => resolver.resolveLayoutEntryType("extra"));
    });

    it("only observes own enumerable properties (ignores inherited)", () => {
      const proto = { "inherited/": "gear:inner" as const };
      const layout = Object.create(proto) as AnyResLayout & { "own/": "shell" };
      (layout as Record<`${string}/`, "shell">)["own/"] = "shell";

      const resolver = new ResLayoutResolver(layout);
      expect(resolver.resolveLayoutEntryType("own")).toBe("shell");
      captureResolveError(() => resolver.resolveLayoutEntryType("inherited"));
    });
  });

  describe("caching behavior", () => {
    it("returns a stable result for repeated lookups of the same namespace", () => {
      const resolver = new ResLayoutResolver({ "app/": "gear:inner", "app/settings/": "shell" });
      for (let i = 0; i < 3; i++) {
        expect(resolver.resolveLayoutEntryType("app/settings/theme")).toBe("shell");
        expect(resolver.resolveLayoutEntryType("app/home")).toBe("gear:inner");
      }
    });

    it("uses a cache that is private per resolver instance", () => {
      const a = new ResLayoutResolver({ "app/": "gear:inner" });
      const b = new ResLayoutResolver({ "app/": "shell" });
      expect(a.resolveLayoutEntryType("app")).toBe("gear:inner");
      expect(b.resolveLayoutEntryType("app")).toBe("shell");
      // Second round: if they shared a cache, one would contaminate the other.
      expect(a.resolveLayoutEntryType("app")).toBe("gear:inner");
      expect(b.resolveLayoutEntryType("app")).toBe("shell");
    });
  });

  describe("edge-case prefixes", () => {
    it("treats a root '/' prefix as matching '' or namespaces starting with '/'", () => {
      // The minimal prefix allowed by the type system is "/" (empty base + trailing slash).
      // It matches the empty namespace (its base ""), exact "/" itself, and any "/…".
      const resolver = new ResLayoutResolver({ "/": "gear:inner" });
      expect(resolver.resolveLayoutEntryType("")).toBe("gear:inner");
      expect(resolver.resolveLayoutEntryType("/anything")).toBe("gear:inner");
      captureResolveError(() => resolver.resolveLayoutEntryType("app"));
    });

    it("matches a namespace that equals the prefix verbatim (trailing slash included)", () => {
      const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
      // Exact equality of namespace and prefix — the quirky but valid case.
      expect(resolver.resolveLayoutEntryType("app/")).toBe("gear:inner");
    });

    it("matches a deeply-nested prefix exactly and at boundaries only", () => {
      const resolver = new ResLayoutResolver({ "a/b/c/": "shell" });
      expect(resolver.resolveLayoutEntryType("a/b/c")).toBe("shell");
      expect(resolver.resolveLayoutEntryType("a/b/c/d")).toBe("shell");
      captureResolveError(() => resolver.resolveLayoutEntryType("a/b/cd"));
      captureResolveError(() => resolver.resolveLayoutEntryType("a/b"));
    });
  });
});

// --- ResLayoutResolver — resolveNamespaceParts -------------------------------

describe("ResLayoutResolver — resolveNamespaceParts", () => {
  it("splits a namespace into its registered prefix and the remaining suffix", () => {
    const resolver = new ResLayoutResolver({ "app/": "gear:inner", "app/settings/": "shell" });
    expect(resolver.resolveNamespaceParts("app/home")).toEqual(["app/", "home"]);
    expect(resolver.resolveNamespaceParts("app/settings/theme")).toEqual(["app/settings/", "theme"]);
  });

  it("returns the prefix and an empty suffix when the namespace equals the prefix's base", () => {
    const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
    expect(resolver.resolveNamespaceParts("app")).toEqual(["app/", ""]);
  });

  it("throws RMachineResolveError when no prefix matches", () => {
    const resolver = new ResLayoutResolver({ "app/": "gear:inner" });
    captureResolveError(() => resolver.resolveNamespaceParts("other"));
  });
});

// --- ResLayoutResolver — resolvePath -----------------------------------------

describe("ResLayoutResolver — resolvePath", () => {
  const resolver = new ResLayoutResolver({ "app/": "gear:inner" });

  describe("gear layout types — locale is ignored", () => {
    it.each(["gear:inner", "gear:base", "gear:outer", "gear:outer(vertex)"] as const)(
      "%s returns the namespace unchanged when locale is undefined",
      (layoutType) => {
        expect(resolver.resolvePath("app", undefined, layoutType)).toBe("app");
      }
    );

    it.each(["gear:inner", "gear:base", "gear:outer", "gear:outer(vertex)"] as const)(
      "%s ignores the locale and still returns the namespace when one is provided",
      (layoutType) => {
        expect(resolver.resolvePath("app", "en-US", layoutType)).toBe("app");
        expect(resolver.resolvePath("app/home", "it-IT", layoutType)).toBe("app/home");
      }
    );
  });

  describe("shell(mono) layout — locale is ignored", () => {
    it("returns the namespace unchanged when locale is undefined", () => {
      expect(resolver.resolvePath("app", undefined, "shell(mono)")).toBe("app");
    });

    it("ignores the locale and still returns the namespace when one is provided", () => {
      // shell(mono) is a shell whose locale handling happens elsewhere, so
      // the path resolver must not append the locale to the namespace.
      expect(resolver.resolvePath("app", "en-US", "shell(mono)")).toBe("app");
      expect(resolver.resolvePath("app/home", "it-IT", "shell(mono)")).toBe("app/home");
    });
  });

  describe("shell layout", () => {
    it("appends the locale as a final path segment", () => {
      expect(resolver.resolvePath("app", "en-US", "shell")).toBe("app/en-US");
      expect(resolver.resolvePath("app/home", "it-IT", "shell")).toBe("app/home/it-IT");
    });

    it("appends the locale verbatim, without normalization", () => {
      // The path resolver is a low-level primitive: locale canonicalization
      // must have happened upstream. Document that by asserting raw pass-through.
      expect(resolver.resolvePath("app", "EN_us", "shell")).toBe("app/EN_us");
    });

    it("throws RMachineResolveError when the locale is undefined", () => {
      const error = captureResolveError(() => resolver.resolvePath("app", undefined, "shell"));
      expect(error.code).toBe(ERR_RESOLVE_FAILED);
      expect(error.message).toContain('"app"');
      expect(error.message).toContain("shell");
      expect(error.message).toContain("locale is required");
    });
  });

  describe("purity", () => {
    it("is a pure function of its three arguments — interleaved layout types do not interfere", () => {
      // Call order must not affect outcome. Interleaving different layout
      // types must produce the same answers as calling each in isolation.
      expect(resolver.resolvePath("app", "en-US", "shell")).toBe("app/en-US");
      expect(resolver.resolvePath("app", "en-US", "gear:inner")).toBe("app");
      expect(resolver.resolvePath("app", "en-US", "shell")).toBe("app/en-US");
      expect(resolver.resolvePath("app", undefined, "shell(mono)")).toBe("app");
      expect(resolver.resolvePath("app", "en-US", "gear:outer(vertex)")).toBe("app");
    });
  });
});

// --- helper functions --------------------------------------------------------

describe("getResFamilyFromLayoutType", () => {
  it.each([
    ["gear:inner", "gear"],
    ["gear:base", "gear"],
    ["gear:outer", "gear"],
    ["gear:outer(vertex)", "gear"],
    ["shell", "shell"],
    ["shell(mono)", "shell"],
  ] as const)("collapses %s to family %s", (type, family) => {
    expect(getResFamilyFromLayoutType(type)).toBe(family);
  });
});

describe("getGearRoleFromLayoutType", () => {
  it.each([
    ["gear:inner", "inner"],
    ["gear:base", "base"],
    ["gear:outer", "outer"],
    ["gear:outer(vertex)", "outer"],
  ] as const)("returns role %s for %s", (type, role) => {
    expect(getGearRoleFromLayoutType(type)).toBe(role);
  });

  it.each(["shell", "shell(mono)"] as const)("returns undefined for non-gear layout %s", (type) => {
    expect(getGearRoleFromLayoutType(type)).toBeUndefined();
  });
});

describe("isOuterGearLayoutType", () => {
  it.each([
    ["gear:outer", true],
    ["gear:outer(vertex)", true],
    ["gear:inner", false],
    ["gear:base", false],
    ["shell", false],
    ["shell(mono)", false],
  ] as const)("returns %s for %s", (type, expected) => {
    expect(isOuterGearLayoutType(type)).toBe(expected);
  });
});

describe("isVertexGearLayoutType", () => {
  it.each([
    ["gear:outer(vertex)", true],
    ["gear:outer", false],
    ["gear:inner", false],
    ["gear:base", false],
    ["shell", false],
    ["shell(mono)", false],
  ] as const)("returns %s for %s", (type, expected) => {
    expect(isVertexGearLayoutType(type)).toBe(expected);
  });
});

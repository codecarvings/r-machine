import { describe, expect, it } from "vitest";
import {
  type AnyResLayout,
  createResLayoutEntryTypeResolver,
  createResPathResolver,
  type ResLayoutEntryTypeResolver,
} from "../../src/core/res-layout.js";
import { ERR_RESOLVE_FAILED } from "../../src/errors/error-codes.js";
import { RMachineResolveError } from "../../src/errors/r-machine-resolve-error.js";

describe("createResLayoutEntryTypeResolver", () => {
  describe("exact-match semantics", () => {
    it("resolves when the namespace equals a registered prefix's base (prefix without trailing '/')", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" });
      expect(resolve("app")).toBe("gear");
    });

    it("returns undefined when no prefix matches", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" });
      expect(resolve("other")).toBeUndefined();
    });

    it("returns undefined for an empty layout regardless of namespace", () => {
      const resolve = createResLayoutEntryTypeResolver({});
      expect(resolve("")).toBeUndefined();
      expect(resolve("anything")).toBeUndefined();
      expect(resolve("a/b/c")).toBeUndefined();
    });
  });

  describe("path-boundary prefix matching", () => {
    it("matches a child namespace only at a '/' boundary", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" });
      expect(resolve("app/home")).toBe("gear");
      expect(resolve("app/deeply/nested/key")).toBe("gear");
    });

    it("does not treat a longer namespace that merely starts with the prefix's base as a match", () => {
      // Classic boundary bug: "app/" must NOT match "application".
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" });
      expect(resolve("application")).toBeUndefined();
      expect(resolve("apps")).toBeUndefined();
      expect(resolve("app-extra")).toBeUndefined();
    });

    it("does not match when the namespace is strictly shorter than the prefix's base", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/home/": "gear" });
      expect(resolve("app")).toBeUndefined();
      expect(resolve("app/hom")).toBeUndefined();
    });

    it("requires the character immediately after the prefix's base to be '/', not any other separator", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" });
      expect(resolve("app.home")).toBeUndefined();
      expect(resolve("app:home")).toBeUndefined();
      expect(resolve("app_home")).toBeUndefined();
    });
  });

  describe("longest-prefix-wins precedence", () => {
    it("picks the most specific (longest) matching prefix over a shorter one", () => {
      const resolve = createResLayoutEntryTypeResolver({
        "app/": "gear",
        "app/settings/": "shell",
      });
      expect(resolve("app/settings")).toBe("shell");
      expect(resolve("app/settings/theme")).toBe("shell");
      expect(resolve("app/home")).toBe("gear");
    });

    it("is independent of the declaration order in the input object", () => {
      const shortFirst = createResLayoutEntryTypeResolver({
        "app/": "gear",
        "app/settings/": "shell",
      });
      const longFirst = createResLayoutEntryTypeResolver({
        "app/settings/": "shell",
        "app/": "gear",
      });
      for (const ns of ["app", "app/home", "app/settings", "app/settings/theme"]) {
        expect(shortFirst(ns)).toBe(longFirst(ns));
      }
    });

    it("selects the deepest prefix across three overlapping levels", () => {
      const resolve = createResLayoutEntryTypeResolver({
        "a/": "gear",
        "a/b/": "shell",
        "a/b/c/": "shell:mono",
      });
      expect(resolve("a")).toBe("gear");
      expect(resolve("a/x")).toBe("gear");
      expect(resolve("a/b")).toBe("shell");
      expect(resolve("a/b/x")).toBe("shell");
      expect(resolve("a/b/c")).toBe("shell:mono");
      expect(resolve("a/b/c/x")).toBe("shell:mono");
    });
  });

  describe("layout-type coverage", () => {
    it("returns each of the four layout types verbatim", () => {
      const resolve = createResLayoutEntryTypeResolver({
        "g/": "gear",
        "v/": "vertex-gear",
        "s/": "shell",
        "d/": "shell:mono",
      });
      expect(resolve("g")).toBe("gear");
      expect(resolve("v")).toBe("vertex-gear");
      expect(resolve("s")).toBe("shell");
      expect(resolve("d")).toBe("shell:mono");
    });
  });

  describe("input-snapshot semantics", () => {
    it("ignores mutations to the layout object performed after resolver creation", () => {
      const layout: { [k: `${string}/`]: "gear" | "shell" | "shell:mono" } = { "app/": "gear" };
      const resolve = createResLayoutEntryTypeResolver(layout);

      // Mutate input after creation.
      layout["app/"] = "shell";
      layout["extra/"] = "shell:mono";
      delete layout["app/"];

      // Resolver behavior stays pinned to the original snapshot.
      expect(resolve("app")).toBe("gear");
      expect(resolve("extra")).toBeUndefined();
    });

    it("only observes own enumerable properties (ignores inherited)", () => {
      const proto = { "inherited/": "gear" as const };
      const layout = Object.create(proto) as AnyResLayout & { "own/": "shell" };
      (layout as Record<`${string}/`, "shell">)["own/"] = "shell";

      const resolve = createResLayoutEntryTypeResolver(layout);
      expect(resolve("own")).toBe("shell");
      expect(resolve("inherited")).toBeUndefined();
    });
  });

  describe("caching behavior", () => {
    it("returns a stable, equal result for repeated lookups of the same namespace", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear", "app/settings/": "shell" });
      for (let i = 0; i < 3; i++) {
        expect(resolve("app/settings/theme")).toBe("shell");
        expect(resolve("app/home")).toBe("gear");
        expect(resolve("unknown")).toBeUndefined();
      }
    });

    it("caches undefined results (cache.has guard, not cache.get fall-through)", () => {
      // Build a layout where the resolver is forced to return undefined; then
      // inspect repeated behavior. The critical implementation detail is that
      // the cache must distinguish "namespace was never looked up" from
      // "namespace was looked up and produced undefined". We verify the contract
      // is observable: the answer is stable, and it matches what we'd get from
      // a fresh resolver with the same (unchanged) input.
      const layout = { "app/": "gear" } as const;
      const resolve = createResLayoutEntryTypeResolver(layout);

      expect(resolve("unknown")).toBeUndefined();
      expect(resolve("unknown")).toBeUndefined();
      expect(resolve("unknown")).toBeUndefined();

      // Cross-check against a freshly-built resolver over the same input.
      const fresh = createResLayoutEntryTypeResolver(layout);
      expect(fresh("unknown")).toBeUndefined();
    });

    it("uses a cache that is private per resolver instance", () => {
      const a = createResLayoutEntryTypeResolver({ "app/": "gear" });
      const b = createResLayoutEntryTypeResolver({ "app/": "shell" });
      expect(a("app")).toBe("gear");
      expect(b("app")).toBe("shell");
      // Second round: if they shared a cache, one would contaminate the other.
      expect(a("app")).toBe("gear");
      expect(b("app")).toBe("shell");
    });
  });

  describe("edge-case prefixes", () => {
    it("treats a root '/' prefix as matching '' or namespaces starting with '/'", () => {
      // The minimal prefix allowed by the type system is "/" (empty base + trailing slash).
      // It matches the empty namespace (its base ""), exact "/" itself, and any "/…".
      const resolve = createResLayoutEntryTypeResolver({ "/": "gear" });
      expect(resolve("")).toBe("gear");
      expect(resolve("/anything")).toBe("gear");
      expect(resolve("app")).toBeUndefined();
    });

    it("matches a namespace that equals the prefix verbatim (trailing slash included)", () => {
      const resolve = createResLayoutEntryTypeResolver({ "app/": "gear" });
      // Exact equality of namespace and prefix — the quirky but valid case.
      expect(resolve("app/")).toBe("gear");
    });

    it("matches a deeply-nested prefix exactly and at boundaries only", () => {
      const resolve = createResLayoutEntryTypeResolver({ "a/b/c/": "shell" });
      expect(resolve("a/b/c")).toBe("shell");
      expect(resolve("a/b/c/d")).toBe("shell");
      expect(resolve("a/b/cd")).toBeUndefined();
      expect(resolve("a/b")).toBeUndefined();
    });
  });
});

describe("createResPathResolver", () => {
  // Small helper to build a resolver paired with an explicit layout, so each
  // test states its premise in one place.
  function withLayout(layout: AnyResLayout) {
    const layoutResolver = createResLayoutEntryTypeResolver(layout);
    return createResPathResolver(layoutResolver);
  }

  describe("gear layout", () => {
    it("returns the namespace unchanged when locale is undefined", () => {
      const resolveResPath = withLayout({ "app/": "gear" });
      expect(resolveResPath("app", undefined)).toBe("app");
    });

    it("ignores the locale and still returns the namespace when one is provided", () => {
      const resolveResPath = withLayout({ "app/": "gear" });
      expect(resolveResPath("app", "en-US")).toBe("app");
      expect(resolveResPath("app/home", "it-IT")).toBe("app/home");
    });
  });

  describe("vertex-gear layout", () => {
    it("returns the namespace unchanged when locale is undefined", () => {
      const resolveResPath = withLayout({ "app/": "vertex-gear" });
      expect(resolveResPath("app", undefined)).toBe("app");
    });

    it("ignores the locale and still returns the namespace when one is provided", () => {
      // Vertex gears never vary by locale — the path resolver must not
      // append the locale, same as regular gears.
      const resolveResPath = withLayout({ "app/": "vertex-gear" });
      expect(resolveResPath("app", "en-US")).toBe("app");
      expect(resolveResPath("app/home", "it-IT")).toBe("app/home");
    });
  });

  describe("shell:mono layout", () => {
    it("returns the namespace unchanged when locale is undefined", () => {
      const resolveResPath = withLayout({ "app/": "shell:mono" });
      expect(resolveResPath("app", undefined)).toBe("app");
    });

    it("ignores the locale and still returns the namespace when one is provided", () => {
      // shell:mono is a shell whose locale handling happens elsewhere, so
      // the path resolver must not append the locale to the namespace.
      const resolveResPath = withLayout({ "app/": "shell:mono" });
      expect(resolveResPath("app", "en-US")).toBe("app");
      expect(resolveResPath("app/home", "it-IT")).toBe("app/home");
    });
  });

  describe("shell layout", () => {
    it("appends the locale as a final path segment", () => {
      const resolveResPath = withLayout({ "app/": "shell" });
      expect(resolveResPath("app", "en-US")).toBe("app/en-US");
      expect(resolveResPath("app/home", "it-IT")).toBe("app/home/it-IT");
    });

    it("appends the locale verbatim, without normalization", () => {
      // The path resolver is a low-level primitive: locale canonicalization
      // must have happened upstream. Document that by asserting raw pass-through.
      const resolveResPath = withLayout({ "app/": "shell" });
      expect(resolveResPath("app", "EN_us")).toBe("app/EN_us");
    });

    it("throws RMachineResolveError when the locale is undefined", () => {
      const resolveResPath = withLayout({ "app/": "shell" });
      try {
        resolveResPath("app", undefined);
        expect.unreachable("expected createResPathResolver to throw for shell without a locale");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineResolveError);
        expect((error as RMachineResolveError).code).toBe(ERR_RESOLVE_FAILED);
        expect((error as RMachineResolveError).message).toContain('"app"');
        expect((error as RMachineResolveError).message).toContain("shell");
        expect((error as RMachineResolveError).message).toContain("locale is required");
      }
    });
  });

  describe("unresolved namespace", () => {
    it("throws RMachineResolveError when the layout resolver returns undefined", () => {
      const resolveResPath = withLayout({ "app/": "gear" });
      try {
        resolveResPath("other", "en-US");
        expect.unreachable("expected createResPathResolver to throw for an unmatched namespace");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineResolveError);
        expect((error as RMachineResolveError).code).toBe(ERR_RESOLVE_FAILED);
        expect((error as RMachineResolveError).message).toContain('"other"');
        expect((error as RMachineResolveError).message).toContain("no matching resource layout");
      }
    });

    it("throws the unresolved-namespace error even when a locale is provided", () => {
      const resolveResPath = withLayout({ "app/": "gear" });
      try {
        resolveResPath("other", "en-US");
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineResolveError);
        expect((error as RMachineResolveError).message).toContain("no matching resource layout");
      }
    });

    it("throws the unresolved-namespace error (not the shell-locale error) for missing namespaces without a locale", () => {
      // The resolver checks layout type *before* validating the locale.
      // An unknown namespace should surface the "no matching layout" error
      // regardless of whether a locale was provided.
      const resolveResPath = withLayout({ "app/": "shell" });
      try {
        resolveResPath("other", undefined);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineResolveError);
        expect((error as RMachineResolveError).message).toContain("no matching resource layout");
      }
    });
  });

  describe("delegation to the layout resolver", () => {
    it("delegates to the supplied resolver exactly once per call", () => {
      const calls: string[] = [];
      const spy: ResLayoutEntryTypeResolver = (ns) => {
        calls.push(ns);
        return ns === "app" ? "gear" : undefined;
      };
      const resolveResPath = createResPathResolver(spy);

      expect(resolveResPath("app", undefined)).toBe("app");
      expect(calls).toEqual(["app"]);

      expect(() => resolveResPath("missing", undefined)).toThrow(RMachineResolveError);
      expect(calls).toEqual(["app", "missing"]);
    });

    it("honors whatever layout type the injected resolver returns, even without caching", () => {
      // A fresh (uncached) resolver still drives correct dispatch. This guards
      // against accidental coupling between createResPathResolver and the cache
      // inside createResLayoutEntryTypeResolver.
      const manual: ResLayoutEntryTypeResolver = (ns) => {
        if (ns === "g") return "gear";
        if (ns === "v") return "vertex-gear";
        if (ns === "s") return "shell";
        if (ns === "d") return "shell:mono";
        return undefined;
      };
      const resolveResPath = createResPathResolver(manual);

      expect(resolveResPath("g", "en")).toBe("g");
      expect(resolveResPath("v", "en")).toBe("v");
      expect(resolveResPath("s", "en")).toBe("s/en");
      expect(resolveResPath("d", "en")).toBe("d");
    });
  });
});

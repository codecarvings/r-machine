import { describe, expect, it } from "vitest";
import {
  cloneCtx,
  cloneKit,
  cloneListPlugin,
  cloneMapPlugin,
  cloneSurfaceWithOverride,
  hasOverrides,
} from "../../src/lib/mock-merge.js";

// These are the pure runtime-override primitives behind mockPlug. They are
// exercised end-to-end by mock-plug.test.ts, but several branches (empty
// overrides, mixed overridden/non-overridden kit entries, eager-vs-deferred kit
// getters, list no-override slots, the map kit→top-level mirror) only surface
// with hand-built plugin shapes — covered here directly.

describe("mock-merge", () => {
  describe("hasOverrides", () => {
    it("is true for a dep/positional override", () => {
      expect(hasOverrides({ "0": { x: 1 } })).toBe(true);
      expect(hasOverrides({ "dep/a": { x: 1 } })).toBe(true);
    });

    it("is false for an empty override and for a `$`-only override with no ports/kit", () => {
      expect(hasOverrides({})).toBe(false);
      expect(hasOverrides({ $: {} })).toBe(false);
      // `$.locale`-only is applied upstream by re-resolving — not an override here.
      expect(hasOverrides({ $: { locale: "it" } })).toBe(false);
    });

    it("is true when `$.ports` or `$.kit` is present", () => {
      expect(hasOverrides({ $: { ports: { p: 1 } } })).toBe(true);
      expect(hasOverrides({ $: { kit: { k: {} } } })).toBe(true);
    });
  });

  describe("cloneSurfaceWithOverride", () => {
    it("returns the SAME surface for an empty/undefined partial (no work)", () => {
      const surface = { a: 1 };
      expect(cloneSurfaceWithOverride(surface, undefined)).toBe(surface);
      expect(cloneSurfaceWithOverride(surface, {})).toBe(surface);
    });

    it("layers the partial onto a fresh object, copying untouched members", () => {
      const proto = { kind: "surface" };
      const surface = Object.create(proto) as Record<string, unknown>;
      Object.defineProperty(surface, "keep", { enumerable: true, value: 1 });
      Object.defineProperty(surface, "replace", { enumerable: true, value: "old" });

      const out = cloneSurfaceWithOverride(surface, { replace: "new" }) as Record<string, unknown>;

      expect(out).not.toBe(surface);
      expect(Object.getPrototypeOf(out)).toBe(proto);
      expect(out.keep).toBe(1); // untouched member copied by descriptor
      expect(out.replace).toBe("new"); // overridden member replaced
      expect(surface.replace).toBe("old"); // original untouched
    });
  });

  describe("cloneKit", () => {
    it("copies non-overridden entries by descriptor and replaces overridden ones lazily", () => {
      const kit = { a: { v: "a" }, b: { v: "b" } };
      const out = cloneKit(kit, { a: { v: "A" } }) as Record<string, { v: string }>;

      // Untouched entry copied verbatim (same reference).
      expect(out.b).toBe(kit.b);
      // Overridden entry: lazy getter producing a merged clone.
      expect(out.a.v).toBe("A");
      expect(kit.a.v).toBe("a"); // original untouched
    });

    it("reads an EAGER (plain value) original entry at access time", () => {
      const original = { v: "eager", other: 7 };
      const kit = { a: original };
      const out = cloneKit(kit, { a: { v: "patched" } }) as Record<string, { v: string; other: number }>;

      const got = out.a; // triggers the lazy getter → origDesc.value branch
      expect(got.v).toBe("patched");
      expect(got.other).toBe(7); // untouched key from the eager original
      // Memoized: a second read returns the same clone.
      expect(out.a).toBe(got);
    });

    it("reads a DEFERRED (getter) original entry only at access time", () => {
      let reads = 0;
      const kit = {};
      Object.defineProperty(kit, "a", {
        enumerable: true,
        configurable: true,
        get: () => {
          reads++;
          return { v: "deferred" };
        },
      });

      const out = cloneKit(kit, { a: { extra: true } }) as Record<string, { v: string; extra: boolean }>;
      // The original getter is NOT called until the override entry is accessed.
      expect(reads).toBe(0);

      const got = out.a; // now the deferred getter fires (origDesc.get branch)
      expect(got.v).toBe("deferred");
      expect(got.extra).toBe(true);
      expect(reads).toBe(1);
    });

    it("synthesizes an empty base when overriding a key absent from the original kit", () => {
      const kit = {}; // no `a` at all → origDesc undefined
      const out = cloneKit(kit, { a: { fresh: 1 } }) as Record<string, { fresh: number }>;

      // `original ?? Object.create(null)` right-hand side.
      expect(out.a.fresh).toBe(1);
    });
  });

  describe("cloneCtx", () => {
    it("deep-merges `$.ports` onto a fresh ports object without mutating the original", () => {
      const $ = { ports: { a: 1, nested: { x: 1 } }, other: "keep" };
      const out = cloneCtx($, { ports: { nested: { x: 2 } } }) as typeof $;

      expect(out).not.toBe($);
      expect(out.ports).toEqual({ a: 1, nested: { x: 2 } });
      expect(out.other).toBe("keep");
      expect($.ports.nested.x).toBe(1); // original untouched
    });

    it("returns the SAME `$` when there is no ctx override / no ports+kit", () => {
      const $ = { ports: { a: 1 } };
      expect(cloneCtx($, undefined)).toBe($);
      expect(cloneCtx($, { locale: "it" })).toBe($); // locale-only → no clone
    });
  });

  describe("cloneMapPlugin", () => {
    it("applies a dep override and copies the rest by descriptor", () => {
      const plugin = { "dep/a": { value: 1 }, "dep/b": { value: 2 }, $: { ports: {}, kit: {} } };
      const out = cloneMapPlugin(plugin, { "dep/a": { value: 99 } }) as typeof plugin;

      expect(out["dep/a"].value).toBe(99);
      expect(out["dep/b"]).toBe(plugin["dep/b"]); // untouched dep copied by descriptor
      expect(plugin["dep/a"].value).toBe(1); // original untouched
    });

    it("mirrors a kit override onto the hoisted top-level key (same surface as `$.kit`)", () => {
      const helper = { greet: () => "hi" };
      const plugin = {
        // hoisted top-level kit entry, same object as `$.kit.helper`
        helper,
        $: { kit: { helper } },
      };
      const out = cloneMapPlugin(plugin, { $: { kit: { helper: { greet: () => "ciao" } } } }) as {
        helper: { greet: () => string };
        $: { kit: { helper: { greet: () => string } } };
      };

      // Top-level hoist delegates to the single cloned kit entry.
      expect(out.helper.greet()).toBe("ciao");
      expect(out.helper).toBe(out.$.kit.helper); // same overridden surface
    });

    it("leaves a kit name shadowed by a same-named dep override to the dep view", () => {
      const helper = { greet: () => "hi" };
      const plugin = { helper, $: { kit: { helper } } };
      // Override BOTH a dep named `helper` and the kit `helper`: the top-level
      // mirror is skipped (`!hasOwn(data, key)` is false), dep view wins.
      const out = cloneMapPlugin(plugin, {
        helper: { greet: () => "dep" },
        $: { kit: { helper: { greet: () => "kit" } } },
      }) as { helper: { greet: () => string }; $: { kit: { helper: { greet: () => string } } } };

      expect(out.helper.greet()).toBe("dep"); // dep override, not the kit mirror
      expect(out.$.kit.helper.greet()).toBe("kit"); // kit override still reachable via `$.kit`
    });
  });

  describe("cloneListPlugin", () => {
    it("overrides only the targeted index and passes the rest through untouched", () => {
      const d0 = { value: 1 };
      const d1 = { value: 2 };
      const ctx = { ports: {}, kit: {} };
      const out = cloneListPlugin([d0, d1, ctx], { "0": { value: 50 } });

      expect((out[0] as { value: number }).value).toBe(50); // overridden slot
      expect(out[1]).toBe(d1); // no-override slot passed through (same ref)
      expect(d0.value).toBe(1); // original untouched
      expect(out[2]).toBe(ctx); // ctx with no override returned as-is
    });
  });
});

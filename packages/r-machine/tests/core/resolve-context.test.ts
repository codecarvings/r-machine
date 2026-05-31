import { describe, expect, it } from "vitest";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResLayout } from "../../src/core/res-layout.js";
import { attachResolveContext, getResolveContext } from "../../src/core/resolve-context.js";
import { buildResolveEnv, innerGearModule } from "../_fixtures/build-resolve-env.js";

const ns = (s: string) => s as AnyNamespace;
const LAYOUT: AnyResLayout = { "i/": "gear:inner" };

describe("resolve-context — attach/get", () => {
  it("round-trips namespace / locale / chain", () => {
    const err = new Error("boom");
    attachResolveContext(err, { namespace: ns("i/x"), locale: "en", chain: [ns("i/root"), ns("i/x")] });

    expect(getResolveContext(err)).toEqual({
      namespace: "i/x",
      locale: "en",
      chain: ["i/root", "i/x"],
    });
  });

  it("stores the context on a non-enumerable key (no enumerable symbol props leak)", () => {
    const err = new Error("boom");
    attachResolveContext(err, { namespace: ns("i/x"), locale: undefined, chain: [ns("i/x")] });

    const enumerableSymbols = Object.getOwnPropertySymbols(err).filter(
      (s) => Object.getOwnPropertyDescriptor(err, s)?.enumerable
    );
    expect(enumerableSymbols).toEqual([]);
    // ...but it is still readable through the helper.
    expect(getResolveContext(err)?.namespace).toBe("i/x");
  });

  it("is a no-op for non-object throws", () => {
    expect(() =>
      attachResolveContext("just a string", { namespace: ns("i/x"), locale: undefined, chain: [] })
    ).not.toThrow();
    expect(getResolveContext("just a string")).toBeUndefined();
    expect(getResolveContext(42)).toBeUndefined();
    expect(getResolveContext(undefined)).toBeUndefined();
  });

  it("is a best-effort no-op on a frozen error (does not throw, error still propagates)", () => {
    const err = Object.freeze(new Error("frozen"));
    expect(() =>
      attachResolveContext(err, { namespace: ns("i/x"), locale: undefined, chain: [ns("i/x")] })
    ).not.toThrow();
    expect(getResolveContext(err)).toBeUndefined();
  });

  it("attaches-if-absent: the deepest (first) attribution wins", () => {
    const err = new Error("boom");
    attachResolveContext(err, { namespace: ns("i/child"), locale: "en", chain: [ns("i/parent"), ns("i/child")] });
    // A parent re-attaching later must not overwrite the deeper context.
    attachResolveContext(err, { namespace: ns("i/parent"), locale: "en", chain: [ns("i/parent")] });

    expect(getResolveContext(err)?.namespace).toBe("i/child");
  });
});

describe("resolve-context — through resolve", () => {
  it("attaches attribution to a throwing factory's error while preserving identity", async () => {
    const sentinel = new Error("boom");
    const env = buildResolveEnv(LAYOUT, {
      "i/boom": innerGearModule((c) =>
        c.define(() => {
          throw sentinel;
        })
      ),
    });

    try {
      await env.resolve(ns("i/boom"));
      expect.unreachable("resolve should reject");
    } catch (err) {
      // Same object, same prototype — identity preserved for control-flow / instanceof.
      expect(err).toBe(sentinel);
      expect(err).toBeInstanceOf(Error);
      const ctx = getResolveContext(err);
      expect(ctx?.namespace).toBe("i/boom");
      const chain = ctx?.chain ?? [];
      expect(chain[chain.length - 1]).toBe("i/boom");
    }
  });

  it("attributes the deepest failing namespace when a dependency throws", async () => {
    const env = buildResolveEnv(LAYOUT, {
      "i/child": innerGearModule((c) =>
        c.define(() => {
          throw new Error("child boom");
        })
      ),
      "i/parent": innerGearModule((c) => c.withDeps("i/child").define(() => ({ ok: true }))),
    });

    try {
      await env.resolve(ns("i/parent"));
      expect.unreachable("resolve should reject");
    } catch (err) {
      const ctx = getResolveContext(err);
      expect(ctx?.namespace).toBe("i/child"); // the namespace that actually failed
      const chain = ctx?.chain ?? [];
      expect(chain[chain.length - 1]).toBe("i/child");
      expect(chain).toContain("i/parent"); // full path retained
    }
  });
});

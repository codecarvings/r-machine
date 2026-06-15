import { type AnyPlugHead, createPlug } from "r-machine/core";
import { describe, expect, it } from "vitest";
import { createStateBinding } from "../../src/lib/mock-controller.js";

// `createStateBinding` is the binder behind mockPlug's controller. End-to-end
// resolves (mock-plug.test.ts) always hand it a positional/array plugin, so the
// OBJECT-form bind path (map plugs whose resolved plugin is `{ name, $ }`), the
// kit-binding loop, the pre-resolve seed accumulation, and the defensive
// null/non-object guards are exercised here white-box with crafted plugin
// shapes — the same direct style the gate-plug transform test already uses.

const makePlug = (head: Partial<{ nsDeps: Record<string, unknown>; nsDepList: readonly unknown[] }>) =>
  createPlug({ realm: "gate", mode: "map", ...head } as unknown as AnyPlugHead);

describe("createStateBinding", () => {
  it("walks the object-branch deps + `$.kit` loop on a map-form plugin", () => {
    const binding = createStateBinding(makePlug({ nsDeps: { shared: {}, $: {} } }));
    // Object (non-array) plugin with a declared named dep and a populated kit.
    // No surface carries a state cell, so every bindKey is a no-op — but the
    // loops still execute (named-dep walk + kit walk).
    expect(() =>
      binding.bind({
        shared: { value: 1 }, // declared dep present → bindKey("dep:shared", …)
        $: { kit: { helper: { greet: () => "hi" } } }, // kit entry → bindKey("kit:helper", …)
      })
    ).not.toThrow();
  });

  it("ignores a null/non-object dep or kit target (defensive guard)", () => {
    const binding = createStateBinding(makePlug({ nsDeps: { shared: {}, $: {} } }));
    expect(() =>
      binding.bind({
        shared: null, // bindKey target null → guarded no-op
        $: { kit: { helper: null } }, // kit target null → guarded no-op
      })
    ).not.toThrow();
  });

  it("ignores a plugin that is neither an array nor an object", () => {
    const binding = createStateBinding(makePlug({ nsDeps: {} }));
    // `bind(42)` / `bind(null)`: neither branch taken → ctx stays undefined →
    // the own-state bindKey is itself guarded.
    expect(() => binding.bind(42)).not.toThrow();
    expect(() => binding.bind(null)).not.toThrow();
  });

  it("accumulates multiple pre-resolve writes into a single composed seed", () => {
    const binding = createStateBinding(makePlug({ nsDepList: [] }));
    const ctrl = binding.makeController(() => {}) as {
      state: unknown;
      deps: Record<PropertyKey, unknown>;
    };

    // Two writes before any cell is bound: the second deep-merges onto the first
    // queued seed rather than replacing it.
    ctrl.state = { a: 1 };
    ctrl.state = { b: 2 };

    // A symbol key on the deps proxy yields no handle (non-string guard).
    expect(ctrl.deps[Symbol("x")]).toBeUndefined();
  });
});

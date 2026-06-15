import { describe, expect, it } from "vitest";
import { wrapReactiveResult } from "../../src/core/react-compiler-support.js";

const EMPTY: ReadonlySet<string> = new Set();

// Minimal surfaces: identity + a live-ish field, enough to assert wrapping and
// passthrough without standing up the whole machine.
function surface(value: unknown): { read: unknown } {
  return { read: value };
}

describe("wrapReactiveResult — list mode", () => {
  it("wraps reactive dep positions (fresh identity, reads forward), leaves non-reactive deps and trailing $ alone when no reactive kit", () => {
    const cart = surface("cart");
    const shell = surface("shell");
    const $ = { kit: {}, locale: "en" };
    const result = [cart, shell, $];

    const wrapped = wrapReactiveResult(result, {
      isList: true,
      nsDepList: ["outer/cart", "shell/x"],
      reactiveDepsSet: new Set(["outer/cart"]),
      reactiveMapKeys: EMPTY,
      reactiveKitKeys: EMPTY,
    }) as unknown[];

    expect(wrapped).not.toBe(result); // new array
    expect(wrapped[0]).not.toBe(cart); // reactive dep → fresh identity
    expect((wrapped[0] as typeof cart).read).toBe("cart"); // reads forward
    expect(wrapped[1]).toBe(shell); // non-reactive dep untouched
    expect(wrapped[2]).toBe($); // no reactive kit → $ untouched
  });

  it("leaves a non-object reactive dep position untouched (wrapSurface passthrough)", () => {
    // A reactive dep position holding a primitive must forward verbatim — there
    // is no object identity to refresh.
    const $ = { kit: {}, locale: "en" };
    const result = [42, $];

    const wrapped = wrapReactiveResult(result, {
      isList: true,
      nsDepList: ["outer/x"],
      reactiveDepsSet: new Set(["outer/x"]),
      reactiveMapKeys: EMPTY,
      reactiveKitKeys: EMPTY,
    }) as unknown[];

    expect(wrapped[0]).toBe(42);
  });

  it("leaves $.kit alone when it is absent despite declared reactive kit keys (wrapKit passthrough)", () => {
    // reactiveKitKeys is non-empty (so the `$` proxy is built), but `$` carries
    // no `kit` — wrapKit's non-object guard returns it verbatim.
    const $ = { locale: "en" } as { locale: string; kit?: unknown };
    const result = [surface("dep"), $];

    const wrapped = wrapReactiveResult(result, {
      isList: true,
      nsDepList: ["shell/x"],
      reactiveDepsSet: EMPTY,
      reactiveMapKeys: EMPTY,
      reactiveKitKeys: new Set(["cart"]),
    }) as unknown[];

    const w$ = wrapped[1] as { locale: string; kit?: unknown };
    expect(w$.locale).toBe("en");
    expect(w$.kit).toBeUndefined();
  });

  it("returns an empty list verbatim (no trailing $ to wrap)", () => {
    const wrapped = wrapReactiveResult([], {
      isList: true,
      nsDepList: [],
      reactiveDepsSet: EMPTY,
      reactiveMapKeys: EMPTY,
      reactiveKitKeys: EMPTY,
    }) as unknown[];

    expect(wrapped).toEqual([]);
  });

  it("wraps reactive $.kit entries and gives $ a fresh identity, forwarding non-kit fields", () => {
    const cartKit = surface("cartKit");
    const fmt = surface("fmt");
    const $ = { kit: { cart: cartKit, fmt }, locale: "en" };
    const result = [surface("dep"), $];

    const wrapped = wrapReactiveResult(result, {
      isList: true,
      nsDepList: ["shell/x"],
      reactiveDepsSet: EMPTY,
      reactiveMapKeys: EMPTY,
      reactiveKitKeys: new Set(["cart"]),
    }) as unknown[];

    const w$ = wrapped[1] as typeof $;
    expect(w$).not.toBe($); // $ wrapped (kit has reactive entries)
    expect(w$.locale).toBe("en"); // non-kit field forwards
    expect(w$.kit.cart).not.toBe(cartKit); // reactive kit entry wrapped
    expect((w$.kit.cart as typeof cartKit).read).toBe("cartKit"); // reads forward
    expect(w$.kit.fmt).toBe(fmt); // non-reactive kit entry untouched
    expect(w$.kit).toBe(w$.kit); // $.kit proxy is memoized (stable across reads)
  });
});

describe("wrapReactiveResult — map mode", () => {
  it("wraps reactive top-level keys (dep + spread kit) and $.kit, sharing one proxy per underlying surface", () => {
    const nav = surface("nav"); // reactive dep
    const cartKit = surface("cartKit"); // reactive kit, spread at top level AND under $.kit
    const fmt = surface("fmt"); // non-reactive kit
    const $ = { kit: { cart: cartKit, fmt }, locale: "en" };
    const result = { nav, cart: cartKit, fmt, $ };

    const wrapped = wrapReactiveResult(result, {
      isList: false,
      nsDepList: [],
      reactiveDepsSet: EMPTY,
      reactiveMapKeys: new Set(["nav", "cart"]),
      reactiveKitKeys: new Set(["cart"]),
    }) as typeof result;

    expect(wrapped.nav).not.toBe(nav); // reactive dep key wrapped
    expect((wrapped.nav as typeof nav).read).toBe("nav");
    expect(wrapped.fmt).toBe(fmt); // non-reactive top-level untouched
    expect(wrapped.cart).not.toBe(cartKit); // reactive kit spread wrapped
    // Same underlying surface reached via top-level spread AND $.kit → same proxy:
    expect(wrapped.$.kit.cart).toBe(wrapped.cart);
    expect(wrapped.$.kit.fmt).toBe(fmt); // non-reactive kit entry untouched
  });

  it("does not wrap when there are no reactive keys", () => {
    const fmt = surface("fmt");
    const $ = { kit: { fmt }, locale: "en" };
    const result = { fmt, $ };

    const wrapped = wrapReactiveResult(result, {
      isList: false,
      nsDepList: [],
      reactiveDepsSet: EMPTY,
      reactiveMapKeys: EMPTY,
      reactiveKitKeys: EMPTY,
    }) as typeof result;

    expect(wrapped.fmt).toBe(fmt);
    expect(wrapped.$).toBe($); // no reactive kit → $ untouched
  });
});

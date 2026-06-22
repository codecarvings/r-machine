import { describe, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { DirectPlug } from "../fixtures/mock-plug/setup.js";
import { r as greet } from "../fixtures/mock-plug/shell-greet.js";

// The `mockPlug` locale-override key is named by plug kind — see `MockCtxContent`.
// The override means three different things, so each kind exposes only the key
// that is true for it (the wrong key is invisible in autocomplete and a compile
// error). The positive ambient-consumer case (`$.ambientLocale` on a real
// Plug / ClientPlug / ServerPlug) is covered by the react/next example tests,
// which mock real consumer plugs without an `as never` cast.
describe("mockPlug locale-override key — named by realm (type-level)", () => {
  it("RESOURCE plug (shell): `$.locale` (resolve-at) is accepted; `$.ambientLocale` is not", () => {
    // A resource shell's mock pins the locale it resolves AT — the override wins.
    mockPlug(greet.plug).with({ $: { locale: "it" } });
    // `ambientLocale` is a consumer-only concept — there is no ambient container
    // behind a resource plug.
    // @ts-expect-error — no `ambientLocale` key on a resource-plug mock.
    mockPlug(greet.plug).with({ $: { ambientLocale: "it" } });
  });

  it("carrier input infers the same head as the bare plug (`mockPlug(r)` ≡ `mockPlug(r.plug)`)", () => {
    // Passing the ResMatrix carrier resolves the SAME map head as its `.plug`, so
    // the resource-plug locale key (`$.locale`) is accepted and `ambientLocale` is
    // rejected — identical to the `mockPlug(greet.plug)` case above.
    mockPlug(greet).with({ $: { locale: "it" } });
    // @ts-expect-error — carrier inference is identical: no `ambientLocale` key.
    mockPlug(greet).with({ $: { ambientLocale: "it" } });
  });

  it("DirectPlug: neither `$.locale` nor `$.ambientLocale` — the locale is always explicit", () => {
    const dplug = DirectPlug("base/helper");
    // DirectPlug has no ambient container, and its `useR(locale)` is always
    // explicit, so the mock exposes NO locale key at all — mock a dependency.
    // @ts-expect-error — no `ambientLocale` key on a DirectPlug mock.
    mockPlug(dplug).with({ $: { ambientLocale: "it" } });
    // @ts-expect-error — and no `locale` key either.
    mockPlug(dplug).with({ $: { locale: "it" } });
    // Overriding a dependency is the supported path (positional dep `0`).
    mockPlug(dplug).with({ 0: { greet: () => "MOCK", shout: () => "X" } });
  });
});

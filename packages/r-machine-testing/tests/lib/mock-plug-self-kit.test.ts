import { describe, expect, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as selfKit } from "../fixtures/mock-plug/self-kit.js";

// Regression: a shell that lives in a machine-wide kit pointing at itself
// resolves with a deferred SELF-reference getter on `$.kit.self`. The locale
// override forces an eager by-namespace resolve of that very shell, whose own
// kit is then self-referential → the deferred getter is installed and throws
// (ERR_CIRCULAR_DEPENDENCY) while its slot is still mid-resolution. That is
// exactly when `mockPlug`'s state-binding scan runs during the mocked plug's
// own resolve. The scan must tolerate (skip) a kit entry that throws on access;
// otherwise mocking ANY kit-resident shell explodes on a cycle that is broken
// and invisible at runtime.
describe("mockPlug — kit-resident shell with deferred self-reference (regression)", () => {
  it("binds at the default locale without tripping the deferred self-ref kit getter", async () => {
    using _ctrl = mockPlug(selfKit).with({ $: { locale: "en" } });
    const inst = await selfKit.create();
    expect(inst.tag).toBe("self@en");
  });

  it("re-resolves at the overridden locale", async () => {
    using _ctrl = mockPlug(selfKit).with({ $: { locale: "it" } });
    const inst = await selfKit.create();
    expect(inst.tag).toBe("self@it");
  });
});

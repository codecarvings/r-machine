import { afterEach, describe, expect, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as kitConsumer } from "../fixtures/mock-plug/kit-consumer.js";
import { r as greet } from "../fixtures/mock-plug/shell-greet.js";

const resets: Array<() => void> = [];
afterEach(() => {
  for (const reset of resets.splice(0)) {
    reset();
  }
});

describe("mockPlug — kit override (map hoist mirror)", () => {
  it("overrides a kit entry and mirrors it onto the hoisted top-level", async () => {
    resets.push(
      mockPlug(kitConsumer.plug).with({
        $: { kit: { helper: { greet: () => "MOCKED" } } },
      })
    );

    const inst = await kitConsumer.create();
    expect(inst.viaKit()).toBe("MOCKED"); // via $.kit.helper
    expect(inst.viaHoist()).toBe("MOCKED"); // hoisted top-level mirrors $.kit
    expect(inst.sameRef()).toBe(true); // both resolve to the same surface object
    expect(inst.viaShout()).toBe("AAA"); // non-overridden kit member preserved
  });

  it("restores the production kit after reset", async () => {
    const reset = mockPlug(kitConsumer.plug).with({
      $: { kit: { helper: { greet: () => "MOCKED" } } },
    });
    await kitConsumer.create();
    reset();

    const prod = await kitConsumer.create();
    expect(prod.viaKit()).toBe("hi x");
    expect(prod.viaHoist()).toBe("hi x");
  });
});

describe("mockPlug — locale override (§14.3/14.4)", () => {
  it("re-resolves a shell in the overridden locale", async () => {
    const def = await greet.create();
    expect(def.greeting).toBe("Hello"); // default (no locale) → fallback branch

    resets.push(mockPlug(greet.plug).with({ $: { locale: "it" } }));
    const localized = await greet.create();
    expect(localized.greeting).toBe("Ciao");
  });
});

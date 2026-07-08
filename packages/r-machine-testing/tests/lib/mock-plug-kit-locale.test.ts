import { instantiateRes } from "r-machine/core";
import { describe, expect, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as kitConsumer } from "../fixtures/mock-plug/kit-consumer.js";
import { r as greet } from "../fixtures/mock-plug/shell-greet.js";

describe("mockPlug — kit override (map hoist mirror)", () => {
  it("overrides a kit entry and mirrors it onto the hoisted top-level", async () => {
    // `using` restores the plug at scope exit via `[Symbol.dispose]`.
    using _ctrl = mockPlug(kitConsumer.plug).with({
      $: { kit: { helper: { greet: () => "MOCKED" } } },
    });

    const inst = await instantiateRes(kitConsumer);
    expect(inst.viaKit()).toBe("MOCKED"); // via $.kit.helper
    expect(inst.viaHoist()).toBe("MOCKED"); // hoisted top-level mirrors $.kit
    expect(inst.sameRef()).toBe(true); // both resolve to the same surface object
    expect(inst.viaShout()).toBe("AAA"); // non-overridden kit member preserved
  });

  it("restores the production kit after reset", async () => {
    const { reset } = mockPlug(kitConsumer.plug).with({
      $: { kit: { helper: { greet: () => "MOCKED" } } },
    });
    await instantiateRes(kitConsumer);
    reset();

    const prod = await instantiateRes(kitConsumer);
    expect(prod.viaKit()).toBe("hi x");
    expect(prod.viaHoist()).toBe("hi x");
  });
});

describe("mockPlug — locale override (§14.3/14.4)", () => {
  it("re-resolves a shell in the overridden locale", async () => {
    const def = await instantiateRes(greet);
    expect(def.greeting).toBe("Hello"); // default (no locale) → fallback branch

    using _ctrl = mockPlug(greet.plug).with({ $: { locale: "it" } });
    const localized = await instantiateRes(greet);
    expect(localized.greeting).toBe("Ciao");
  });
});

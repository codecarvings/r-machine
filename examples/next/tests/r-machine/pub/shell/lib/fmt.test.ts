import { mockPlug } from "@r-machine/testing";
import { describe, expect, it } from "vitest";
import { r as fmt } from "@/r-machine/pub/shell/lib/fmt";

describe("shell/lib/fmt", () => {
  it("formats numbers using the default locale", async () => {
    using ctrl = mockPlug(fmt).default();
    const enFmt = await ctrl.createRes(); // default locale
    expect(enFmt.number(123.4)).toBe("123.4");
  });

  it("formats numbers using the active locale", async () => {
    using ctrl = mockPlug(fmt).with({ $: { locale: "it" } });
    const itFmt = await ctrl.createRes();
    expect(itFmt.number(123.4)).toBe("123,4");
  });
});

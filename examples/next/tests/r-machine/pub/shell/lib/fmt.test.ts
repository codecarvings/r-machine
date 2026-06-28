import { mockPlug } from "@r-machine/testing";
import { describe, expect, it } from "vitest";
import { r as fmt } from "@/r-machine/pub/shell/lib/fmt";

describe("shell/lib/fmt", () => {
  it("formats numbers using the default locale", async () => {
    using _ctrl = mockPlug(fmt).default();
    const enFmt = await fmt.create(); // default locale
    expect(enFmt.number(123.4)).toBe("123.4");
  });

  it("formats numbers using the active locale", async () => {
    using _ctrl = mockPlug(fmt).with({ $: { locale: "it" } });
    const itFmt = await fmt.create();
    expect(itFmt.number(123.4)).toBe("123,4");
  });
});

import { describe, expect, it } from "vitest";
import { localeHeaderName } from "../../src/core/proxy.js";

describe("localeHeaderName", () => {
  // Pinned: it is a wire value, agreed between the proxy that writes it, the
  // server toolset that reads it back, and now consumer code that may do either
  it("equals 'x-rm-locale'", () => {
    expect(localeHeaderName).toBe("x-rm-locale");
  });
});

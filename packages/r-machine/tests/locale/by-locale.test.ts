import { describe, expect, it, vi } from "vitest";
import { byLocale } from "../../src/locale/by-locale.js";

describe("byLocale", () => {
  it("should return different results for different locales", () => {
    const fn = byLocale((locale) => ({ locale }));
    expect(fn("en")).toEqual({ locale: "en" });
    expect(fn("it")).toEqual({ locale: "it" });
  });

  it("should call the factory only once per locale", () => {
    const factory = vi.fn((locale: string) => ({ locale }));
    const fn = byLocale(factory);

    fn("en");
    fn("en");
    fn("en");

    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith("en");
  });

  it("should return the same reference for repeated calls with the same locale", () => {
    const fn = byLocale((locale) => ({ locale }));
    const first = fn("en");
    const second = fn("en");
    expect(first).toBe(second);
  });

  it("should call the factory once per distinct locale", () => {
    const factory = vi.fn((locale: string) => ({ locale }));
    const fn = byLocale(factory);

    fn("en");
    fn("it");
    fn("en");
    fn("it");

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("should cache falsy return values without re-calling the factory", () => {
    const factory = vi.fn(() => null);
    const fn = byLocale(factory);

    const first = fn("en");
    const second = fn("en");

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

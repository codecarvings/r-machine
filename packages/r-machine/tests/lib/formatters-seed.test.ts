import { describe, expect, it, vi } from "vitest";
import { FormattersSeed } from "../../src/lib/formatters-seed.js";

describe("FormattersSeed.create", () => {
  describe("static .get", () => {
    it("invokes the factory and returns its result", () => {
      const Fmt = FormattersSeed.create((locale: string) => ({ lang: locale }));
      expect(Fmt.get("en")).toEqual({ lang: "en" });
    });

    it("returns different results for different locales", () => {
      const Fmt = FormattersSeed.create((locale: string) => ({ lang: locale }));
      expect(Fmt.get("en")).toEqual({ lang: "en" });
      expect(Fmt.get("it")).toEqual({ lang: "it" });
    });

    it("calls the factory only once per locale", () => {
      const factory = vi.fn((locale: string) => ({ lang: locale }));
      const Fmt = FormattersSeed.create(factory);

      Fmt.get("en");
      Fmt.get("en");
      Fmt.get("en");

      expect(factory).toHaveBeenCalledTimes(1);
      expect(factory).toHaveBeenCalledWith("en");
    });

    it("returns the same reference for repeated calls with the same locale", () => {
      const Fmt = FormattersSeed.create((locale: string) => ({ lang: locale }));
      const first = Fmt.get("en");
      const second = Fmt.get("en");
      expect(first).toBe(second);
    });

    it("calls the factory once per distinct locale", () => {
      const factory = vi.fn((locale: string) => ({ lang: locale }));
      const Fmt = FormattersSeed.create(factory);

      Fmt.get("en");
      Fmt.get("it");
      Fmt.get("en");
      Fmt.get("it");

      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe("instance .get", () => {
    it("returns the same result as the static .get", () => {
      const Fmt = FormattersSeed.create((locale: string) => ({ lang: locale }));
      const instance = new Fmt();

      expect(instance.get("en")).toEqual({ lang: "en" });
      expect(instance.get("en")).toBe(Fmt.get("en"));
    });

    it("shares the cache with the static .get", () => {
      const factory = vi.fn((locale: string) => ({ lang: locale }));
      const Fmt = FormattersSeed.create(factory);

      Fmt.get("en");
      const instance = new Fmt();
      instance.get("en");

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple provider classes", () => {
    it("each FormattersSeed.create call produces an independent cache", () => {
      const factory1 = vi.fn((locale: string) => ({ source: "first", lang: locale }));
      const factory2 = vi.fn((locale: string) => ({ source: "second", lang: locale }));

      const Fmt1 = FormattersSeed.create(factory1);
      const Fmt2 = FormattersSeed.create(factory2);

      Fmt1.get("en");
      Fmt2.get("en");

      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).toHaveBeenCalledTimes(1);
      expect(Fmt1.get("en")).not.toBe(Fmt2.get("en"));
    });
  });

  describe("edge cases", () => {
    it("propagates factory errors without caching them", () => {
      let callCount = 0;
      const Fmt = FormattersSeed.create((_locale: string) => {
        callCount++;
        if (callCount === 1) throw new Error("boom");
        return { recovered: true };
      });

      expect(() => Fmt.get("en")).toThrow("boom");
      expect(Fmt.get("en")).toEqual({ recovered: true });
      expect(callCount).toBe(2);
    });
  });

  describe("formatter object shape", () => {
    it("preserves complex formatter objects with Intl-like members", () => {
      const Fmt = FormattersSeed.create((locale: string) => ({
        number: new Intl.NumberFormat(locale),
        date: new Intl.DateTimeFormat(locale),
      }));

      const fmt = Fmt.get("en");
      expect(fmt.number).toBeInstanceOf(Intl.NumberFormat);
      expect(fmt.date).toBeInstanceOf(Intl.DateTimeFormat);
    });

    it("factory receives the locale string unmodified", () => {
      const factory = vi.fn((_locale: string) => ({}));
      const Fmt = FormattersSeed.create(factory);

      Fmt.get("en-US");
      expect(factory).toHaveBeenCalledWith("en-US");
    });
  });
});

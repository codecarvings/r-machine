import { describe, expectTypeOf, it } from "vitest";

import type { RMachineConfigError } from "#r-machine/errors";
import type { MatchLocalesAlgorithm } from "#r-machine/locale";
import { LocaleHelper } from "../../src/lib/locale-helper.js";

describe("LocaleHelper", () => {
  it("should be a class", () => {
    expectTypeOf(LocaleHelper).toBeConstructibleWith(["en", "fr"], "en");
  });

  it("constructor should accept readonly string array and string", () => {
    expectTypeOf(LocaleHelper).constructorParameters.toEqualTypeOf<
      [locales: readonly string[], defaultLocale: string]
    >();
  });

  describe("matchLocales", () => {
    it("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper<string>>().toHaveProperty("matchLocales");
    });

    it("should accept readonly string array as first parameter", () => {
      expectTypeOf<LocaleHelper<string>["matchLocales"]>().parameter(0).toEqualTypeOf<readonly string[]>();
    });

    it("should accept optional MatchLocalesAlgorithm as second parameter", () => {
      expectTypeOf<LocaleHelper<string>["matchLocales"]>()
        .parameter(1)
        .toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
    });

    it("should return a string", () => {
      expectTypeOf<LocaleHelper<string>["matchLocales"]>().returns.toBeString();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper<string>["matchLocales"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("matchLocalesForAcceptLanguageHeader", () => {
    it("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper<string>>().toHaveProperty("matchLocalesForAcceptLanguageHeader");
    });

    it("should accept string | undefined | null as first parameter", () => {
      expectTypeOf<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(0)
        .toEqualTypeOf<string | undefined | null>();
    });

    it("should accept optional MatchLocalesAlgorithm as second parameter", () => {
      expectTypeOf<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(1)
        .toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
    });

    it("should return a string", () => {
      expectTypeOf<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>().returns.toBeString();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>>().not.toExtend<
        Promise<unknown>
      >();
    });
  });

  describe("validateLocale", () => {
    it("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper<string>>().toHaveProperty("validateLocale");
    });

    it("should accept a string parameter", () => {
      expectTypeOf<LocaleHelper<string>["validateLocale"]>().parameter(0).toBeString();
    });

    it("should return RMachineConfigError | null", () => {
      expectTypeOf<LocaleHelper<string>["validateLocale"]>().returns.toEqualTypeOf<RMachineConfigError | null>();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper<string>["validateLocale"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("protected members are not publicly accessible", () => {
    it("should not expose locales", () => {
      expectTypeOf<LocaleHelper<string>>().not.toHaveProperty("locales");
    });

    it("should not expose defaultLocale", () => {
      expectTypeOf<LocaleHelper<string>>().not.toHaveProperty("defaultLocale");
    });

    it("should not expose localeSet", () => {
      expectTypeOf<LocaleHelper<string>>().not.toHaveProperty("localeSet");
    });
  });

  describe("method return type consistency", () => {
    it("matchLocales and matchLocalesForAcceptLanguageHeader return the same type", () => {
      expectTypeOf<ReturnType<LocaleHelper<string>["matchLocales"]>>().toEqualTypeOf<
        ReturnType<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>
      >();
    });

    it("both matching methods share the same algorithm parameter type", () => {
      expectTypeOf<Parameters<LocaleHelper<string>["matchLocales"]>[1]>().toEqualTypeOf<
        Parameters<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>[1]
      >();
    });
  });

  describe("generic type parameter L", () => {
    type NarrowLocale = "en" | "it";

    it("matchLocales should return the narrow locale type", () => {
      expectTypeOf<LocaleHelper<NarrowLocale>["matchLocales"]>().returns.toEqualTypeOf<NarrowLocale>();
    });

    it("matchLocalesForAcceptLanguageHeader should return the narrow locale type", () => {
      expectTypeOf<
        LocaleHelper<NarrowLocale>["matchLocalesForAcceptLanguageHeader"]
      >().returns.toEqualTypeOf<NarrowLocale>();
    });

    it("narrow and wide helpers should share the same validateLocale signature", () => {
      expectTypeOf<LocaleHelper<NarrowLocale>["validateLocale"]>().toEqualTypeOf<
        LocaleHelper<string>["validateLocale"]
      >();
    });

    it("narrow matching methods return type should not widen to string", () => {
      expectTypeOf<ReturnType<LocaleHelper<NarrowLocale>["matchLocales"]>>().not.toEqualTypeOf<string>();
    });

    it("method return type consistency holds for narrow locale type", () => {
      expectTypeOf<ReturnType<LocaleHelper<NarrowLocale>["matchLocales"]>>().toEqualTypeOf<
        ReturnType<LocaleHelper<NarrowLocale>["matchLocalesForAcceptLanguageHeader"]>
      >();
    });
  });
});

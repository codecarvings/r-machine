import { describe, expectTypeOf, it } from "vitest";

import type { RMachineError } from "../../../src/errors/r-machine-error.js";
import { LocaleHelper } from "../../../src/lib/locale-helper.js";
import type { MatchLocalesAlgorithm } from "../../../src/locale/locale-matcher.js";

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
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocales");
    });

    it("should accept readonly string array as first parameter", () => {
      expectTypeOf<LocaleHelper["matchLocales"]>().parameter(0).toEqualTypeOf<readonly string[]>();
    });

    it("should accept optional MatchLocalesAlgorithm as second parameter", () => {
      expectTypeOf<LocaleHelper["matchLocales"]>().parameter(1).toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
    });

    it("should return a string", () => {
      expectTypeOf<LocaleHelper["matchLocales"]>().returns.toBeString();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper["matchLocales"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("matchLocalesForAcceptLanguageHeader", () => {
    it("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocalesForAcceptLanguageHeader");
    });

    it("should accept string | undefined | null as first parameter", () => {
      expectTypeOf<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(0)
        .toEqualTypeOf<string | undefined | null>();
    });

    it("should accept optional MatchLocalesAlgorithm as second parameter", () => {
      expectTypeOf<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(1)
        .toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
    });

    it("should return a string", () => {
      expectTypeOf<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>().returns.toBeString();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("validateLocale", () => {
    it("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("validateLocale");
    });

    it("should accept a string parameter", () => {
      expectTypeOf<LocaleHelper["validateLocale"]>().parameter(0).toBeString();
    });

    it("should return RMachineError | null", () => {
      expectTypeOf<LocaleHelper["validateLocale"]>().returns.toEqualTypeOf<RMachineError | null>();
    });

    it("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper["validateLocale"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("protected members are not publicly accessible", () => {
    it("should not expose locales", () => {
      expectTypeOf<LocaleHelper>().not.toHaveProperty("locales");
    });

    it("should not expose defaultLocale", () => {
      expectTypeOf<LocaleHelper>().not.toHaveProperty("defaultLocale");
    });

    it("should not expose localeSet", () => {
      expectTypeOf<LocaleHelper>().not.toHaveProperty("localeSet");
    });
  });

  describe("public API surface", () => {
    it("should have matchLocales", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocales");
    });

    it("should have matchLocalesForAcceptLanguageHeader", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocalesForAcceptLanguageHeader");
    });

    it("should have validateLocale", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("validateLocale");
    });
  });

  describe("method return type consistency", () => {
    it("matchLocales and matchLocalesForAcceptLanguageHeader return the same type", () => {
      expectTypeOf<ReturnType<LocaleHelper["matchLocales"]>>().toEqualTypeOf<
        ReturnType<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>
      >();
    });

    it("both matching methods share the same algorithm parameter type", () => {
      expectTypeOf<Parameters<LocaleHelper["matchLocales"]>[1]>().toEqualTypeOf<
        Parameters<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>[1]
      >();
    });
  });
});

import { describe, expectTypeOf, test } from "vitest";

import type { RMachineError } from "../../../src/errors/r-machine-error.js";
import { LocaleHelper } from "../../../src/lib/locale-helper.js";
import type { MatchLocalesAlgorithm } from "../../../src/locale/locale-matcher.js";

describe("LocaleHelper", () => {
  test("should be a class", () => {
    expectTypeOf(LocaleHelper).toBeConstructibleWith(["en", "fr"], "en");
  });

  test("constructor should accept readonly string array and string", () => {
    expectTypeOf(LocaleHelper).constructorParameters.toEqualTypeOf<
      [locales: readonly string[], defaultLocale: string]
    >();
  });

  describe("matchLocales", () => {
    test("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocales");
    });

    test("should accept readonly string array as first parameter", () => {
      expectTypeOf<LocaleHelper["matchLocales"]>().parameter(0).toEqualTypeOf<readonly string[]>();
    });

    test("should accept optional MatchLocalesAlgorithm as second parameter", () => {
      expectTypeOf<LocaleHelper["matchLocales"]>().parameter(1).toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
    });

    test("should return a string", () => {
      expectTypeOf<LocaleHelper["matchLocales"]>().returns.toBeString();
    });

    test("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper["matchLocales"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("matchLocalesForAcceptLanguageHeader", () => {
    test("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocalesForAcceptLanguageHeader");
    });

    test("should accept string | undefined | null as first parameter", () => {
      expectTypeOf<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(0)
        .toEqualTypeOf<string | undefined | null>();
    });

    test("should accept optional MatchLocalesAlgorithm as second parameter", () => {
      expectTypeOf<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(1)
        .toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
    });

    test("should return a string", () => {
      expectTypeOf<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>().returns.toBeString();
    });

    test("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("validateLocale", () => {
    test("should be a property on LocaleHelper", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("validateLocale");
    });

    test("should accept a string parameter", () => {
      expectTypeOf<LocaleHelper["validateLocale"]>().parameter(0).toBeString();
    });

    test("should return RMachineError | null", () => {
      expectTypeOf<LocaleHelper["validateLocale"]>().returns.toEqualTypeOf<RMachineError | null>();
    });

    test("return type should not be a promise", () => {
      expectTypeOf<ReturnType<LocaleHelper["validateLocale"]>>().not.toExtend<Promise<unknown>>();
    });
  });

  describe("protected members are not publicly accessible", () => {
    test("should not expose locales", () => {
      expectTypeOf<LocaleHelper>().not.toHaveProperty("locales");
    });

    test("should not expose defaultLocale", () => {
      expectTypeOf<LocaleHelper>().not.toHaveProperty("defaultLocale");
    });

    test("should not expose localeSet", () => {
      expectTypeOf<LocaleHelper>().not.toHaveProperty("localeSet");
    });
  });

  describe("public API surface", () => {
    test("should have matchLocales", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocales");
    });

    test("should have matchLocalesForAcceptLanguageHeader", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("matchLocalesForAcceptLanguageHeader");
    });

    test("should have validateLocale", () => {
      expectTypeOf<LocaleHelper>().toHaveProperty("validateLocale");
    });
  });

  describe("method return type consistency", () => {
    test("matchLocales and matchLocalesForAcceptLanguageHeader return the same type", () => {
      expectTypeOf<ReturnType<LocaleHelper["matchLocales"]>>().toEqualTypeOf<
        ReturnType<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>
      >();
    });

    test("both matching methods share the same algorithm parameter type", () => {
      expectTypeOf<Parameters<LocaleHelper["matchLocales"]>[1]>().toEqualTypeOf<
        Parameters<LocaleHelper["matchLocalesForAcceptLanguageHeader"]>[1]
      >();
    });
  });
});

import { describe, expectTypeOf, it } from "vitest";
import type { RMachineConfigError } from "#r-machine/errors";
import { LocaleHelper } from "../../src/locale/locale-helper.js";
import type { MatchLocalesAlgorithm } from "../../src/locale/locale-matcher.js";

describe("LocaleHelper", () => {
  it("constructor takes (locales: readonly string[], defaultLocale: string)", () => {
    expectTypeOf(LocaleHelper).constructorParameters.toEqualTypeOf<
      [locales: readonly string[], defaultLocale: string]
    >();
  });

  describe("method signatures", () => {
    it("matchLocales(requested: readonly string[], algorithm?) => string", () => {
      expectTypeOf<LocaleHelper<string>["matchLocales"]>().parameter(0).toEqualTypeOf<readonly string[]>();
      expectTypeOf<LocaleHelper<string>["matchLocales"]>()
        .parameter(1)
        .toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
      expectTypeOf<LocaleHelper<string>["matchLocales"]>().returns.toBeString();
    });

    it("matchLocalesForAcceptLanguageHeader(header: string | undefined | null, algorithm?) => string", () => {
      expectTypeOf<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(0)
        .toEqualTypeOf<string | undefined | null>();
      expectTypeOf<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>()
        .parameter(1)
        .toEqualTypeOf<MatchLocalesAlgorithm | undefined>();
      expectTypeOf<LocaleHelper<string>["matchLocalesForAcceptLanguageHeader"]>().returns.toBeString();
    });

    it("validateLocale(locale: string) => RMachineConfigError | null", () => {
      expectTypeOf<LocaleHelper<string>["validateLocale"]>().parameter(0).toBeString();
      expectTypeOf<LocaleHelper<string>["validateLocale"]>().returns.toEqualTypeOf<RMachineConfigError | null>();
    });
  });

  describe("public readonly members", () => {
    it("exposes locales as readonly LocaleList<L>", () => {
      expectTypeOf<LocaleHelper<"en" | "it">["locales"]>().toEqualTypeOf<readonly ("en" | "it")[]>();
    });

    it("exposes defaultLocale as L", () => {
      expectTypeOf<LocaleHelper<"en" | "it">["defaultLocale"]>().toEqualTypeOf<"en" | "it">();
    });

    it("keeps the localeSet cache internal (not on the public type)", () => {
      expectTypeOf<LocaleHelper<string>>().not.toHaveProperty("localeSet");
    });
  });

  describe("generic type parameter L", () => {
    type NarrowLocale = "en" | "it";

    it("both matching methods return the narrow L, not widened to string", () => {
      expectTypeOf<LocaleHelper<NarrowLocale>["matchLocales"]>().returns.toEqualTypeOf<NarrowLocale>();
      expectTypeOf<
        LocaleHelper<NarrowLocale>["matchLocalesForAcceptLanguageHeader"]
      >().returns.toEqualTypeOf<NarrowLocale>();
    });

    it("rejects a non-AnyLocale type argument", () => {
      // @ts-expect-error - number does not satisfy AnyLocale (string)
      type _Invalid = LocaleHelper<number>;
    });
  });
});

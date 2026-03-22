import type { AnyFmtProvider, RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import { vi } from "vitest";
import type { TestLocale } from "./constants.js";

export type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

export const VALID_LOCALES = new Set(["en", "it"]);

export interface MockMachineOverrides<L extends string = TestLocale> {
  defaultLocale?: NoInfer<L>;
  locales?: readonly L[];
  hybridPickR?: (locale: string, namespace: string) => unknown;
  hybridPickRKit?: (locale: string, ...namespaces: string[]) => unknown;
  pickR?: (locale: string, namespace: string) => Promise<unknown>;
  pickRKit?: (locale: string, ...namespaces: string[]) => Promise<unknown>;
  fmt?: (locale: string) => unknown;
}

export function createMockMachine<L extends string = TestLocale>(overrides: MockMachineOverrides<L> = {}) {
  const locales = overrides.locales ?? (["en", "it"] as const);
  const defaultLocale = overrides.defaultLocale ?? "en";

  return {
    locales,
    defaultLocale,
    config: { defaultLocale, locales },
    localeHelper: {
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineConfigError(
              ERR_UNKNOWN_LOCALE,
              `Locale "${locale}" is invalid or is not in the list of locales.`
            )
      ),
    },
    hybridPickR: vi.fn(overrides.hybridPickR ?? (() => ({ greeting: "hello" }))),
    hybridPickRKit: vi.fn(overrides.hybridPickRKit ?? (() => [{ greeting: "hello" }, { home: "Home" }])),
    pickR: vi.fn(overrides.pickR ?? (() => Promise.resolve({ greeting: "hello" }))),
    pickRKit: vi.fn(overrides.pickRKit ?? (() => Promise.resolve([{ greeting: "hello" }, { home: "Home" }]))),
    fmt: vi.fn(overrides.fmt ?? (() => ({}))),
  } as unknown as RMachine<TestAtlas, L, AnyFmtProvider>;
}

export function createMockMachineForProxy<L extends string = TestLocale>(
  overrides: { defaultLocale?: NoInfer<L>; locales?: readonly L[]; matchLocaleReturn?: NoInfer<L> | undefined } = {}
) {
  const dl = overrides.defaultLocale ?? "en";
  const locales = overrides.locales ?? (["en", "it"] as const);

  return {
    locales,
    defaultLocale: dl,
    config: { defaultLocale: dl, locales },
    localeHelper: {
      matchLocalesForAcceptLanguageHeader: vi.fn(() => overrides.matchLocaleReturn ?? dl),
    },
  } as unknown as RMachine<TestAtlas, L, AnyFmtProvider>;
}

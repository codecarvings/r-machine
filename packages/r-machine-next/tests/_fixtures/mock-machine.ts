import type { RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import { vi } from "vitest";

export type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

export const VALID_LOCALES = new Set(["en", "it"]);

export function createMockMachine(
  overrides: {
    defaultLocale?: string;
    locales?: readonly string[];
    hybridPickR?: (locale: string, namespace: string) => unknown;
    hybridPickRKit?: (locale: string, ...namespaces: string[]) => unknown;
    pickR?: (locale: string, namespace: string) => Promise<unknown>;
    pickRKit?: (locale: string, ...namespaces: string[]) => Promise<unknown>;
  } = {}
) {
  const locales = overrides.locales ?? (["en", "it"] as const);

  return {
    config: { defaultLocale: overrides.defaultLocale ?? "en", locales },
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
  } as unknown as RMachine<TestAtlas>;
}

export function createMockMachineForProxy(
  overrides: { defaultLocale?: string; locales?: readonly string[]; matchLocaleReturn?: string | undefined } = {}
) {
  const dl = overrides.defaultLocale ?? "en";
  const locales = overrides.locales ?? (["en", "it"] as const);

  return {
    config: { defaultLocale: dl, locales },
    localeHelper: {
      matchLocalesForAcceptLanguageHeader: vi.fn(() => overrides.matchLocaleReturn ?? dl),
    },
  } as unknown as RMachine<TestAtlas>;
}

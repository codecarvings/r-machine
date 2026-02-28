import type { RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { vi } from "vitest";

export type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

export const VALID_LOCALES = new Set(["en", "it"]);

export function createMockMachine(
  overrides: {
    hybridPickR?: (locale: string, namespace: string) => unknown;
    hybridPickRKit?: (locale: string, ...namespaces: string[]) => unknown;
  } = {}
) {
  return {
    localeHelper: {
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineError(`Locale "${locale}" is invalid or is not in the list of locales.`)
      ),
    },
    hybridPickR: vi.fn(overrides.hybridPickR ?? (() => ({ greeting: "hello" }))),
    hybridPickRKit: vi.fn(overrides.hybridPickRKit ?? (() => [{ greeting: "hello" }, { home: "Home" }])),
  } as unknown as RMachine<TestAtlas>;
}

import type { RMachine } from "r-machine";
import { type AnyResAtlas, type ExperimentalFlags, PROCESS_SCOPE_PROVIDER, type ResEquipment } from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { MockInstance } from "vitest";
import { vi } from "vitest";

export interface TestAtlas extends AnyResAtlas {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
}

export interface MockMachineSpies {
  readonly hybridPickR: MockInstance;
  readonly hybridPickRKit: MockInstance;
  readonly localeHelper: { readonly validateLocale: MockInstance };
}

export const VALID_LOCALES = new Set(["en", "it"]);

export function createMockMachine(
  overrides: {
    defaultLocale?: string;
    hybridPickR?: (locale: string, namespace: string) => unknown;
    hybridPickRKit?: (locale: string, ...namespaces: string[]) => unknown;
  } = {}
): RMachine<TestAtlas, AnyLocale, ResEquipment<TestAtlas>, ExperimentalFlags> {
  return {
    defaultLocale: overrides.defaultLocale ?? "en",
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
    // No request scope on the client — return the process-default provider so
    // the React adapter falls back to its module-level wireCache.
    requestScope: {
      getProvider: vi.fn(() => PROCESS_SCOPE_PROVIDER),
    },
  } as unknown as RMachine<TestAtlas, AnyLocale, ResEquipment<TestAtlas>, ExperimentalFlags>;
}

/**
 * Type-safe cast to access vi.fn() spies on a mock machine for assertions.
 *
 * Why a separate helper instead of an intersection return type on createMockMachine?
 *
 * If createMockMachine returned `RMachine<TestAtlas, …> & MockMachineSpies`,
 * the untyped `MockInstance` members (hybridPickR, hybridPickRKit) would shadow
 * the generic-typed protected members of RMachine. When TypeScript then tries to
 * infer `RA` in `createReactBareToolset<RA, L, KM>(rMachine)`, the conflicting
 * signatures cause `RA` to degrade from `TestAtlas` to its constraint (`object`),
 * making `useR("common")` return `object` instead of `TestAtlas["common"]`.
 *
 * Keeping the return type as plain `RMachine<TestAtlas, …>` preserves generic
 * inference, while this helper provides typed access to the underlying vi.fn()
 * mocks for assertion purposes only.
 */
export function spies(
  machine: RMachine<TestAtlas, AnyLocale, ResEquipment<TestAtlas>, ExperimentalFlags>
): MockMachineSpies {
  return machine as unknown as MockMachineSpies;
}

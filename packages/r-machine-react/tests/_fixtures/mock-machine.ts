import type { RMachine } from "r-machine";
import {
  type AnyResAtlas,
  type ExperimentalFlags,
  type GateWire,
  PROCESS_SCOPE_PROVIDER,
  type ResEquipment,
} from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import type { MockInstance } from "vitest";
import { vi } from "vitest";
import { createFakeWire } from "./fake-wire.js";

export interface TestAtlas extends AnyResAtlas {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
  // No inner gears — lets ReactStandardStrategy.create() type-check (its guard
  // rejects atlases that declare `gear:inner` entries).
  readonly "let@gear:inner": {};
}

export interface MockMachineSpies {
  readonly getGateWire: MockInstance;
  readonly localeHelper: { readonly validateLocale: MockInstance };
}

export const VALID_LOCALES = new Set(["en", "it"]);

/** Default per-namespace surface resolver — tests override for specific shapes. */
const defaultResolve = (ns: string): unknown => ({ ns });

export interface CreateMockMachineOptions {
  readonly defaultLocale?: string;
  /** Maps a (namespace, locale) to the surface a Plug resolves for it. */
  readonly resolve?: (ns: string, locale: string) => unknown;
  /** Which namespaces are treated as vertex (drives per-consumer wire caching). */
  readonly isVertexNamespace?: (ns: string) => boolean;
  /** Replace getGateWire wholesale (e.g. to inject a pending/controllable wire). */
  readonly getGateWire?: (...args: unknown[]) => GateWire;
}

export function createMockMachine(
  overrides: CreateMockMachineOptions = {}
): RMachine<TestAtlas, AnyLocale, ResEquipment<TestAtlas>, ExperimentalFlags> {
  const resolve = overrides.resolve ?? defaultResolve;

  // Default getGateWire mirrors JM.getPlugin: build `$ = { kit }`, let the
  // adapter's augmentCtx layer on `$.locale`/`$.setLocale`, then assemble the
  // plugin (`[...deps, $]` for list, `{ ...kit, ...deps, $ }` for map). The
  // resolved wire is settled, so consumers don't suspend.
  const defaultGetGateWire = (
    kit: Record<string, string>,
    nsDeps: string[] | Record<string, string>,
    locale: string,
    augmentCtx: ($: Record<string, unknown>) => void
  ): GateWire => {
    const kitSurfaces: Record<string, unknown> = {};
    for (const k in kit) {
      kitSurfaces[k] = resolve(kit[k] as string, locale);
    }

    const $: Record<string, unknown> = { kit: kitSurfaces };
    augmentCtx($);

    let plugin: unknown;
    if (Array.isArray(nsDeps)) {
      plugin = [...nsDeps.map((ns) => resolve(ns, locale)), $];
    } else {
      const depSurfaces: Record<string, unknown> = {};
      for (const key in nsDeps) {
        depSurfaces[key] = resolve(nsDeps[key] as string, locale);
      }
      plugin = { ...kitSurfaces, ...depSurfaces, $ };
    }

    return createFakeWire(plugin).wire;
  };

  return {
    defaultLocale: overrides.defaultLocale ?? "en",
    localeHelper: {
      defaultLocale: overrides.defaultLocale ?? "en",
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineConfigError(
              ERR_UNKNOWN_LOCALE,
              `Locale "${locale}" is invalid or is not in the list of locales.`
            )
      ),
    },
    getGateWire: vi.fn(overrides.getGateWire ?? (defaultGetGateWire as never)),
    // Default to non-vertex so plugs in tests use the shared wireCache path.
    isVertexNamespace: vi.fn(overrides.isVertexNamespace ?? (() => false)),
    // No request scope on the client — return the process-default provider so
    // the React adapter falls back to its module-level wireCache.
    requestScope: {
      getProvider: vi.fn(() => PROCESS_SCOPE_PROVIDER),
    },
  } as unknown as RMachine<TestAtlas, AnyLocale, ResEquipment<TestAtlas>, ExperimentalFlags>;
}

/**
 * Type-safe cast to access vi.fn() spies on a mock machine for assertions.
 * Keeping createMockMachine's return type as plain RMachine<TestAtlas, …>
 * preserves generic inference at the createReactBareToolset(...) call site;
 * this helper exposes the underlying vi.fn() mocks for assertions only.
 */
export function spies(
  machine: RMachine<TestAtlas, AnyLocale, ResEquipment<TestAtlas>, ExperimentalFlags>
): MockMachineSpies {
  return machine as unknown as MockMachineSpies;
}

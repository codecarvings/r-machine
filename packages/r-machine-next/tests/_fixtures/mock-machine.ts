import type { RMachine } from "r-machine";
import {
  type AnyResAtlas,
  type ExperimentalFlags,
  type GateWire,
  PROCESS_SCOPE_PROVIDER,
  type ResEquipment,
} from "r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError } from "r-machine/errors";
import type { MockInstance } from "vitest";
import { vi } from "vitest";
import type { TestLocale } from "./constants.js";
import { createFakeWire } from "./fake-wire.js";

export interface TestAtlas extends AnyResAtlas {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
  // No inner gears — lets the React-backed client toolset type-check (its guard
  // rejects atlases that declare `gear:inner` entries).
  readonly "let@gear:inner": {};
}

export const VALID_LOCALES = new Set(["en", "it"]);

/** Default per-namespace surface resolver — tests override for specific shapes. */
const defaultResolve = (ns: string): unknown => ({ ns });

export interface MockMachineSpies {
  readonly getGatePlugin: MockInstance;
  readonly getGateWire: MockInstance;
  readonly isVertexNamespace: MockInstance;
  readonly localeHelper: {
    readonly validateLocale: MockInstance;
    readonly matchLocalesForAcceptLanguageHeader: MockInstance;
  };
  readonly requestScope: {
    readonly installProvider: MockInstance;
    readonly dispose: MockInstance;
    readonly getProvider: MockInstance;
  };
}

export interface CreateMockMachineOptions<L extends string = TestLocale> {
  readonly defaultLocale?: NoInfer<L>;
  readonly locales?: readonly L[];
  /** Maps a (namespace, locale) to the surface a Plug resolves for it. */
  readonly resolve?: (ns: string, locale: string) => unknown;
  /** Which namespaces are treated as vertex (drives per-consumer wire caching). */
  readonly isVertexNamespace?: (ns: string) => boolean;
  /** Replace getGateWire wholesale (e.g. to inject a pending/controllable wire). */
  readonly getGateWire?: (...args: unknown[]) => GateWire;
  /** Replace getGatePlugin wholesale (the single-shot, server-side resolve). */
  readonly getGatePlugin?: (...args: unknown[]) => Promise<unknown>;
  readonly matchLocalesForAcceptLanguageHeader?: (header: string | null) => NoInfer<L>;
}

/**
 * Build the plugin the way JM does: assemble `$ = { kit }`, let the adapter's
 * augmentCtx layer on `$.locale`/`$.setLocale`/`$.getPath`/`$.params`, then
 * assemble the plugin (`[...deps, $]` for list, `{ ...kit, ...deps, $ }` for map).
 */
function buildPlugin(
  resolve: (ns: string, locale: string) => unknown,
  kit: Record<string, string>,
  nsDeps: string[] | Record<string, string>,
  locale: string,
  augmentCtx: ($: Record<string, unknown>) => void
): unknown {
  const kitSurfaces: Record<string, unknown> = {};
  for (const k in kit) {
    kitSurfaces[k] = resolve(kit[k] as string, locale);
  }

  const $: Record<string, unknown> = { kit: kitSurfaces };
  augmentCtx($);

  if (Array.isArray(nsDeps)) {
    return [...nsDeps.map((ns) => resolve(ns, locale)), $];
  }
  const depSurfaces: Record<string, unknown> = {};
  for (const key in nsDeps) {
    depSurfaces[key] = resolve(nsDeps[key] as string, locale);
  }
  return { ...kitSurfaces, ...depSurfaces, $ };
}

export function createMockMachine<L extends string = TestLocale>(
  overrides: CreateMockMachineOptions<L> = {}
): RMachine<TestAtlas, L, ResEquipment<TestAtlas>, ExperimentalFlags> {
  const resolve = overrides.resolve ?? defaultResolve;
  const locales = overrides.locales ?? (["en", "it"] as unknown as readonly L[]);
  const defaultLocale = overrides.defaultLocale ?? ("en" as L);

  // Default wire: settled, so client consumers don't suspend.
  const defaultGetGateWire = (
    kit: Record<string, string>,
    nsDeps: string[] | Record<string, string>,
    locale: string,
    augmentCtx: ($: Record<string, unknown>) => void
  ): GateWire => createFakeWire(buildPlugin(resolve, kit, nsDeps, locale, augmentCtx)).wire;

  // Default single-shot resolve mirrors getGatePlugin's contract on the server.
  const defaultGetGatePlugin = (
    kit: Record<string, string>,
    nsDeps: string[] | Record<string, string>,
    locale: string,
    augmentCtx: ($: Record<string, unknown>) => void
  ): Promise<unknown> => Promise.resolve(buildPlugin(resolve, kit, nsDeps, locale, augmentCtx));

  return {
    defaultLocale,
    localeHelper: {
      locales,
      defaultLocale,
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineConfigError(
              ERR_UNKNOWN_LOCALE,
              `Locale "${locale}" is invalid or is not in the list of locales.`
            )
      ),
      matchLocalesForAcceptLanguageHeader: vi.fn(
        overrides.matchLocalesForAcceptLanguageHeader ?? (() => defaultLocale)
      ),
    },
    getGateWire: vi.fn(overrides.getGateWire ?? (defaultGetGateWire as never)),
    getGatePlugin: vi.fn(overrides.getGatePlugin ?? (defaultGetGatePlugin as never)),
    // Default to non-vertex so plugs in tests use the shared wireCache path.
    isVertexNamespace: vi.fn(overrides.isVertexNamespace ?? (() => false)),
    requestScope: {
      // No active request scope on the client — return the process-default
      // provider so the React adapter falls back to its module-level wireCache.
      getProvider: vi.fn(() => PROCESS_SCOPE_PROVIDER),
      installProvider: vi.fn(),
      dispose: vi.fn(),
    },
  } as unknown as RMachine<TestAtlas, L, ResEquipment<TestAtlas>, ExperimentalFlags>;
}

/**
 * Lightweight machine for proxy / server-impl tests, which only consult
 * `localeHelper` (locales, defaultLocale, matchLocalesForAcceptLanguageHeader)
 * and never resolve a plugin.
 */
export function createMockMachineForProxy<L extends string = TestLocale>(
  overrides: { defaultLocale?: NoInfer<L>; locales?: readonly L[]; matchLocaleReturn?: NoInfer<L> | undefined } = {}
): RMachine<TestAtlas, L, ResEquipment<TestAtlas>, ExperimentalFlags> {
  const dl = overrides.defaultLocale ?? ("en" as L);
  const locales = overrides.locales ?? (["en", "it"] as unknown as readonly L[]);

  return {
    defaultLocale: dl,
    localeHelper: {
      locales,
      defaultLocale: dl,
      validateLocale: vi.fn((locale: string) =>
        VALID_LOCALES.has(locale)
          ? null
          : new RMachineConfigError(
              ERR_UNKNOWN_LOCALE,
              `Locale "${locale}" is invalid or is not in the list of locales.`
            )
      ),
      matchLocalesForAcceptLanguageHeader: vi.fn(() => overrides.matchLocaleReturn ?? dl),
    },
  } as unknown as RMachine<TestAtlas, L, ResEquipment<TestAtlas>, ExperimentalFlags>;
}

/**
 * Type-safe cast to access vi.fn() spies on a mock machine for assertions.
 * Keeping createMockMachine's return type as plain RMachine<TestAtlas, …>
 * preserves generic inference at the create*Toolset(...) call site; this
 * helper exposes the underlying vi.fn() mocks for assertions only.
 */
export function spies(
  machine: RMachine<TestAtlas, AnyLocaleArg, ResEquipment<TestAtlas>, ExperimentalFlags>
): MockMachineSpies {
  return machine as unknown as MockMachineSpies;
}

// Loosely-typed locale arg for the spies() accessor — keeps callers from
// having to thread their concrete L through just to read mocks.
type AnyLocaleArg = string;

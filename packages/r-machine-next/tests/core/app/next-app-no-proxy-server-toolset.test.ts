import { RMachineUsageError } from "r-machine/errors";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RMachineProxy } from "#r-machine/next/core";
import { ERR_LOCALE_BIND_CONFLICT } from "#r-machine/next/errors";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppNoProxyServerImpl } from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import { createNextAppNoProxyServerToolset } from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import type { NextAppServerImpl } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestLocale } from "../../_fixtures/constants.js";
import { expectError } from "../../_fixtures/expect-error.js";
import { type CreateMockMachineOptions, createMockMachine } from "../../_fixtures/mock-machine.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNotFound = vi.fn((): never => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

const mockHeadersMap = new Map<string, string>();

const mockCookiesFn = vi.fn(async () => ({}));
const mockHeadersFn = vi.fn(async () => ({
  get: (name: string) => mockHeadersMap.get(name) ?? null,
}));

vi.mock("next/headers", () => ({
  cookies: mockCookiesFn,
  headers: mockHeadersFn,
}));

// Mock react.cache: each cached function memoizes its result until resetCacheScope()
// is called, which simulates a new React server request boundary.
const cacheRegistry: Array<{ reset: () => void }> = [];

function resetCacheScope() {
  for (const entry of cacheRegistry) entry.reset();
}

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
      let cached: unknown;
      let hasCached = false;
      const entry = {
        reset: () => {
          cached = undefined;
          hasCached = false;
        },
      };
      cacheRegistry.push(entry);
      return ((...args: unknown[]) => {
        if (!hasCached) {
          cached = fn(...args);
          hasCached = true;
        }
        return cached;
      }) as unknown as T;
    },
  };
});

vi.mock("#r-machine/next/internal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#r-machine/next/internal")>();
  return {
    ...actual,
    validateServerOnlyUsage: vi.fn(),
  };
});

// Mock the scope-registry module (dynamic import inside NextServerRMachine)
vi.mock("../../../src/core/app/scope-registry.js", () => ({
  registerScope: vi.fn(),
  unregisterScope: vi.fn(),
  lookupScope: vi.fn(),
}));

// Mock the request-scope module (dynamic import inside createNextAppServerToolset)
vi.mock("../../../src/core/app/request-scope.js", () => ({
  nextRequestScopeProvider: {},
}));

// Mock next/server `after` — invoke the callback synchronously so
// NextServerRMachine's cleanup runs within the test.
vi.mock("next/server", () => ({
  after: vi.fn((cb: () => void) => cb()),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_SERVER_KIT = {} as const;

const mockRouteHandlers = {
  entrance: {
    GET: vi.fn(async () => {}),
  },
};

function createMockImpl(
  overrides: Partial<NextAppNoProxyServerImpl<TestLocale, string>> = {}
): NextAppNoProxyServerImpl<TestLocale, string> {
  const base: NextAppServerImpl<TestLocale, string> = {
    localeKey: overrides.localeKey ?? "locale",
    autoLocaleBinding: overrides.autoLocaleBinding ?? false,
    writeLocale: overrides.writeLocale ?? vi.fn(),
    createLocaleStaticParamsGenerator:
      overrides.createLocaleStaticParamsGenerator ??
      vi.fn(async () => async () => [{ locale: "en" }, { locale: "it" }]),
    createProxy: overrides.createProxy ?? vi.fn(async (): Promise<RMachineProxy> => vi.fn() as RMachineProxy),
    createPathComposer: overrides.createPathComposer ?? vi.fn(() => vi.fn(() => "/")),
  };

  return {
    ...base,
    createRouteHandlers: overrides.createRouteHandlers ?? vi.fn(async () => mockRouteHandlers),
  };
}

const MockNextClientRMachine = vi.fn(
  ({ children }: { locale: string; scopeId: string; children: ReactNode }): ReactNode => children
) as unknown as NextAppClientRMachine<TestLocale>;

async function createToolset(
  machineOverrides?: CreateMockMachineOptions,
  implOverrides?: Partial<NextAppNoProxyServerImpl<TestLocale, string>>
) {
  return createNextAppNoProxyServerToolset(
    createMockMachine(machineOverrides),
    TEST_SERVER_KIT,
    createMockImpl(implOverrides),
    MockNextClientRMachine
  );
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  resetCacheScope();
  mockHeadersMap.clear();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createNextAppNoProxyServerToolset", () => {
  // -----------------------------------------------------------------------
  // routeHandlers
  // -----------------------------------------------------------------------

  describe("routeHandlers", () => {
    it("delegates to impl.createRouteHandlers", async () => {
      const createRouteHandlers = vi.fn(async () => mockRouteHandlers);
      const toolset = await createToolset(undefined, { createRouteHandlers });

      expect(toolset.routeHandlers).toBe(mockRouteHandlers);
      expect(createRouteHandlers).toHaveBeenCalledTimes(1);
    });

    it("passes cookies and headers from next/headers to createRouteHandlers", async () => {
      const createRouteHandlers = vi.fn(async () => mockRouteHandlers);
      await createToolset(undefined, { createRouteHandlers });

      expect(createRouteHandlers).toHaveBeenCalledWith(mockCookiesFn, mockHeadersFn);
    });
  });

  // -----------------------------------------------------------------------
  // does not expose rMachineProxy
  // -----------------------------------------------------------------------

  it("does not expose rMachineProxy", async () => {
    const toolset = await createToolset();

    expect(toolset).not.toHaveProperty("rMachineProxy");
  });

  // -----------------------------------------------------------------------
  // Delegation to createNextAppServerToolset
  // -----------------------------------------------------------------------

  describe("delegation", () => {
    it("delegates generateLocaleStaticParams to impl", async () => {
      const params = [{ locale: "en" }, { locale: "it" }];
      const generator = vi.fn(async () => params);
      const toolset = await createToolset(undefined, {
        createLocaleStaticParamsGenerator: vi.fn(async () => generator),
      });

      const result = await toolset.generateLocaleStaticParams();

      expect(result).toEqual(params);
    });

    it("bindLocale returns canonical locale for a valid locale string", async () => {
      const toolset = await createToolset();

      expect(toolset.bindLocale("en")).toBe("en");
    });

    it("bindLocale throws ERR_LOCALE_BIND_CONFLICT when bound with different values", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");

      const error = expectError(() => toolset.bindLocale("it"), RMachineUsageError);
      expect(error.code).toBe(ERR_LOCALE_BIND_CONFLICT);
    });

    it("setLocale calls impl.writeLocale with the new locale", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, { writeLocale });

      await toolset.setLocale("it");

      expect(writeLocale).toHaveBeenCalledTimes(1);
      expect(writeLocale).toHaveBeenCalledWith(undefined, "it", expect.any(Function), expect.any(Function));
    });

    it("ServerPlug resolves with the bound locale", async () => {
      const machine = createMockMachine();
      const toolset = await createNextAppNoProxyServerToolset(
        machine,
        TEST_SERVER_KIT,
        createMockImpl(),
        MockNextClientRMachine
      );

      toolset.bindLocale("it");
      await toolset.ServerPlug("common").useR();

      expect(machine.getGatePlugin).toHaveBeenCalledWith(
        TEST_SERVER_KIT,
        expect.anything(),
        "it",
        expect.any(Function)
      );
    });

    it("NextServerRMachine renders NextClientRMachine with the resolved locale", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");
      const element = (await toolset.NextServerRMachine({ children: "hello" })) as {
        type: unknown;
        props: { locale: string; children: ReactNode };
      };

      expect(element.type).toBe(MockNextClientRMachine);
      expect(element.props.locale).toBe("en");
      expect(element.props.children).toBe("hello");
    });
  });
});

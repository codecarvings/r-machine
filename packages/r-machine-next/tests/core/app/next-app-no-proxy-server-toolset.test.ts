import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppNoProxyServerImpl } from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import { createNextAppNoProxyServerToolset } from "../../../src/core/app/next-app-no-proxy-server-toolset.js";
import type { NextAppServerImpl } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestLocale } from "../../_fixtures/constants.js";
import { createMockMachine, type MockMachineOverrides } from "../../_fixtures/mock-machine.js";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    createProxy: overrides.createProxy ?? vi.fn(async () => vi.fn()),
    createBoundPathComposerSupplier:
      overrides.createBoundPathComposerSupplier ?? vi.fn(async () => async () => vi.fn(() => "/")),
  };

  return {
    ...base,
    createRouteHandlers: overrides.createRouteHandlers ?? vi.fn(async () => mockRouteHandlers),
  };
}

const MockNextClientRMachine = vi.fn(
  ({ children }: { locale: string; children: ReactNode }): ReactNode => children
) as unknown as NextAppClientRMachine<TestLocale>;

async function createToolset(
  machineOverrides?: MockMachineOverrides,
  implOverrides?: Partial<NextAppNoProxyServerImpl<TestLocale, string>>
) {
  return createNextAppNoProxyServerToolset(
    createMockMachine(machineOverrides),
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

      expect(createRouteHandlers).toHaveBeenCalledWith(mockCookiesFn, mockHeadersFn, expect.any(Function));
    });

    it("passes setLocale as third argument to createRouteHandlers", async () => {
      const createRouteHandlers = vi.fn<NextAppNoProxyServerImpl<TestLocale, string>["createRouteHandlers"]>(
        async () => mockRouteHandlers
      );
      const toolset = await createToolset(undefined, { createRouteHandlers });

      const passedSetLocale = createRouteHandlers.mock.calls[0][2];
      expect(passedSetLocale).toBe(toolset.setLocale);
    });
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

    it("delegates getPathComposer to impl.createBoundPathComposerSupplier", async () => {
      const composer = vi.fn(() => "/composed");
      const supplier = vi.fn(async () => composer);
      const toolset = await createToolset(undefined, {
        createBoundPathComposerSupplier: vi.fn(async () => supplier),
      });

      expect(toolset.getPathComposer).toBe(supplier);
    });

    it("bindLocale returns canonical locale for a valid locale string", async () => {
      const toolset = await createToolset();

      expect(toolset.bindLocale("en")).toBe("en");
    });

    it("getLocale returns bound locale", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");
      const locale = await toolset.getLocale();

      expect(locale).toBe("en");
    });

    it("setLocale calls impl.writeLocale with current and new locale", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, { writeLocale });

      toolset.bindLocale("en");
      await toolset.setLocale("it");

      expect(writeLocale).toHaveBeenCalledTimes(1);
      expect(writeLocale).toHaveBeenCalledWith("en", "it", expect.any(Function), expect.any(Function));
    });

    it("pickR delegates to rMachine.pickR with bound locale", async () => {
      const resources = { greeting: "ciao" };
      const machine = createMockMachine({
        pickR: () => Promise.resolve(resources),
      });
      const toolset = await createNextAppNoProxyServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("it");
      const result = await toolset.pickR("common");

      expect(result).toBe(resources);
      expect(machine.pickR).toHaveBeenCalledWith("it", "common");
    });

    it("pickRKit delegates to rMachine.pickRKit with bound locale", async () => {
      const kit = [{ greeting: "hello" }, { home: "Home" }];
      const machine = createMockMachine({
        pickRKit: () => Promise.resolve(kit),
      });
      const toolset = await createNextAppNoProxyServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("en");
      const result = await toolset.pickRKit("common", "nav");

      expect(result).toBe(kit);
      expect(machine.pickRKit).toHaveBeenCalledWith("en", "common", "nav");
    });

    it("getFmt delegates to rMachine.fmt with bound locale", async () => {
      const formatters = { formatDate: () => "2026-01-01" };
      const machine = createMockMachine({
        fmt: () => formatters,
      });
      const toolset = await createNextAppNoProxyServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("it");
      const result = await toolset.getFmt();

      expect(result).toBe(formatters);
      expect(machine.fmt).toHaveBeenCalledWith("it");
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

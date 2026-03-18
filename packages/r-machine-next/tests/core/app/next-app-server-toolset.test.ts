import { ERR_UNKNOWN_LOCALE, RMachineConfigError, RMachineUsageError } from "r-machine/errors";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RMachineProxy } from "#r-machine/next/core";
import { ERR_LOCALE_BIND_CONFLICT, ERR_LOCALE_UNDETERMINED } from "#r-machine/next/errors";
import * as internal from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type { NextAppServerImpl } from "../../../src/core/app/next-app-server-toolset.js";
import { createNextAppServerToolset } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestLocale } from "../../_fixtures/constants.js";
import { expectAsyncError, expectError } from "../../_fixtures/expect-error.js";
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

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({})),
  headers: vi.fn(async () => ({
    get: (name: string) => mockHeadersMap.get(name) ?? null,
  })),
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

function createMockImpl(
  overrides: Partial<NextAppServerImpl<TestLocale, string>> = {}
): NextAppServerImpl<TestLocale, string> {
  return {
    localeKey: overrides.localeKey ?? "locale",
    autoLocaleBinding: overrides.autoLocaleBinding ?? false,
    writeLocale: overrides.writeLocale ?? vi.fn(),
    createLocaleStaticParamsGenerator:
      overrides.createLocaleStaticParamsGenerator ??
      vi.fn(async () => async () => [{ locale: "en" }, { locale: "it" }]),
    createProxy: overrides.createProxy ?? vi.fn(async (): Promise<RMachineProxy> => vi.fn() as RMachineProxy),
    createBoundPathComposerSupplier:
      overrides.createBoundPathComposerSupplier ?? vi.fn(async () => async () => vi.fn(() => "/")),
  };
}

const MockNextClientRMachine = vi.fn(
  ({ children }: { locale: string; children: ReactNode }): ReactNode => children
) as unknown as NextAppClientRMachine<TestLocale>;

async function createToolset(
  machineOverrides?: MockMachineOverrides,
  implOverrides?: Partial<NextAppServerImpl<TestLocale, string>>
) {
  return createNextAppServerToolset(
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

describe("createNextAppServerToolset", () => {
  it("delegates rMachineProxy to impl.createProxy", async () => {
    const proxy = vi.fn() as RMachineProxy;
    const toolset = await createToolset(undefined, {
      createProxy: vi.fn(async (): Promise<RMachineProxy> => proxy),
    });

    expect(toolset.rMachineProxy).toBe(proxy);
  });

  it("delegates generateLocaleStaticParams to impl", async () => {
    const params = [{ locale: "en" }, { locale: "it" }];
    const generator = vi.fn(async () => params);
    const toolset = await createToolset(undefined, {
      createLocaleStaticParamsGenerator: vi.fn(async () => generator),
    });

    const result = await toolset.generateLocaleStaticParams();

    expect(result).toEqual(params);
    expect(generator).toHaveBeenCalled();
  });

  it("delegates getPathComposer to impl.createBoundPathComposerSupplier", async () => {
    const composer = vi.fn(() => "/composed");
    const supplier = vi.fn(async () => composer);
    const toolset = await createToolset(undefined, {
      createBoundPathComposerSupplier: vi.fn(async () => supplier),
    });

    expect(toolset.getPathComposer).toBe(supplier);
  });

  // -----------------------------------------------------------------------
  // bindLocale
  // -----------------------------------------------------------------------

  describe("bindLocale", () => {
    it("returns the canonical locale for a valid locale string", async () => {
      const toolset = await createToolset();

      const result = toolset.bindLocale("en");

      expect(result).toBe("en");
    });

    it("calls notFound for an invalid locale string", async () => {
      const toolset = await createToolset();

      expect(() => toolset.bindLocale("xx")).toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("allows rebinding with the same value", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");
      const result = toolset.bindLocale("en");

      expect(result).toBe("en");
    });

    it("throws ERR_LOCALE_BIND_CONFLICT when bound with different values", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");

      const error = expectError(() => toolset.bindLocale("it"), RMachineUsageError);
      expect(error.code).toBe(ERR_LOCALE_BIND_CONFLICT);
    });

    it("includes both locale values in the conflict error message", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");

      expect(() => toolset.bindLocale("it")).toThrow(/en.*it/);
    });

    it("skips validation on second call with a previously validated locale", async () => {
      const machine = createMockMachine();
      const toolset = await createNextAppServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("en");
      toolset.bindLocale("en");

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledTimes(1);
    });

    it("reuses the locale cache across sync and async bindLocale calls", async () => {
      const machine = createMockMachine();
      const toolset = await createNextAppServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("en");
      await toolset.bindLocale(Promise.resolve({ locale: "en" }));

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledTimes(1);
    });

    it("resolves params promise and binds the locale key", async () => {
      const toolset = await createToolset();
      const params = Promise.resolve({ locale: "it" });

      const result = await toolset.bindLocale(params);

      expect(result).toEqual({ locale: "it" });
    });

    it("calls notFound for invalid locale in async params", async () => {
      const toolset = await createToolset();
      const params = Promise.resolve({ locale: "xx" });

      await expect(toolset.bindLocale(params)).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("throws ERR_LOCALE_BIND_CONFLICT when async bind is followed by a conflicting sync bind", async () => {
      const toolset = await createToolset();

      await toolset.bindLocale(Promise.resolve({ locale: "en" }));

      expect(() => toolset.bindLocale("it")).toThrow(RMachineUsageError);
    });
  });

  // -----------------------------------------------------------------------
  // getLocale
  // -----------------------------------------------------------------------

  describe("getLocale", () => {
    it("returns bound locale when bindLocale was called first", async () => {
      const toolset = await createToolset();

      toolset.bindLocale("en");
      const locale = await toolset.getLocale();

      expect(locale).toBe("en");
    });

    describe("with autoLocaleBinding", () => {
      it("reads locale from the x-rm-locale header", async () => {
        mockHeadersMap.set("x-rm-locale", "it");
        const toolset = await createToolset(undefined, { autoLocaleBinding: true });

        const locale = await toolset.getLocale();

        expect(locale).toBe("it");
      });

      it("throws ERR_LOCALE_UNDETERMINED when header is missing", async () => {
        const toolset = await createToolset(undefined, { autoLocaleBinding: true });

        const error = await expectAsyncError(() => toolset.getLocale(), RMachineUsageError);
        expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
      });

      it("caches the header lookup promise within a request", async () => {
        mockHeadersMap.set("x-rm-locale", "en");
        const toolset = await createToolset(undefined, { autoLocaleBinding: true });

        const [a, b] = await Promise.all([toolset.getLocale(), toolset.getLocale()]);

        expect(a).toBe("en");
        expect(b).toBe("en");

        const headersMock = await import("next/headers");
        expect(vi.mocked(headersMock.headers)).toHaveBeenCalledTimes(1);
      });
    });

    describe("without autoLocaleBinding", () => {
      it("throws ERR_LOCALE_UNDETERMINED when bindLocale was not called", async () => {
        const toolset = await createToolset(undefined, { autoLocaleBinding: false });

        const error = await expectAsyncError(() => toolset.getLocale(), RMachineUsageError);
        expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
      });
    });
  });

  // -----------------------------------------------------------------------
  // setLocale
  // -----------------------------------------------------------------------

  describe("setLocale", () => {
    it("calls impl.writeLocale with the current and new locale", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, {
        writeLocale,
        autoLocaleBinding: false,
      });

      toolset.bindLocale("en");
      await toolset.setLocale("it");

      expect(writeLocale).toHaveBeenCalledTimes(1);
      expect(writeLocale).toHaveBeenCalledWith("en", "it", expect.any(Function), expect.any(Function));
    });

    it("passes undefined as current locale when locale is not bound", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, {
        writeLocale,
        autoLocaleBinding: false,
      });

      await toolset.setLocale("en");

      expect(writeLocale).toHaveBeenCalledWith(undefined, "en", expect.any(Function), expect.any(Function));
    });

    it("throws RMachineUsageError for an invalid locale", async () => {
      const toolset = await createToolset();

      const error = await expectAsyncError(() => toolset.setLocale("xx" as any), RMachineUsageError);
      expect(error.code).toBe(ERR_UNKNOWN_LOCALE);
    });

    it("includes the invalid locale in the error message", async () => {
      const toolset = await createToolset();

      await expect(toolset.setLocale("xx" as any)).rejects.toThrow(/xx/);
    });

    it("wraps the validation error as innerError", async () => {
      const toolset = await createToolset();

      const error = await expectAsyncError(() => toolset.setLocale("xx" as any), RMachineUsageError);
      expect(error.innerError).toBeInstanceOf(RMachineConfigError);
    });

    it("does not call writeLocale when locale is invalid", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, { writeLocale });

      try {
        await toolset.setLocale("xx" as any);
      } catch {
        // expected
      }

      expect(writeLocale).not.toHaveBeenCalled();
    });

    it("reads current locale from header when autoLocaleBinding is enabled and no binding exists", async () => {
      mockHeadersMap.set("x-rm-locale", "en");
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, {
        writeLocale,
        autoLocaleBinding: true,
      });

      await toolset.setLocale("it");

      expect(writeLocale).toHaveBeenCalledWith("en", "it", expect.any(Function), expect.any(Function));
    });

    it("passes undefined as current locale when autoLocaleBinding is enabled but header is missing", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, {
        writeLocale,
        autoLocaleBinding: true,
      });

      await toolset.setLocale("en");

      expect(writeLocale).toHaveBeenCalledWith(undefined, "en", expect.any(Function), expect.any(Function));
    });

    it("reuses the pending unsafe locale promise for concurrent calls", async () => {
      mockHeadersMap.set("x-rm-locale", "en");
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, {
        writeLocale,
        autoLocaleBinding: true,
      });

      await Promise.all([toolset.setLocale("it"), toolset.setLocale("it")]);

      expect(writeLocale).toHaveBeenCalledTimes(2);
      expect(writeLocale).toHaveBeenCalledWith("en", "it", expect.any(Function), expect.any(Function));

      const headersMock = await import("next/headers");
      expect(vi.mocked(headersMock.headers)).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // pickR
  // -----------------------------------------------------------------------

  describe("pickR", () => {
    it("delegates to rMachine.pickR with bound locale", async () => {
      const resources = { greeting: "ciao" };
      const machine = createMockMachine({
        pickR: () => Promise.resolve(resources),
      });
      const toolset = await createNextAppServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("it");
      const result = await toolset.pickR("common");

      expect(result).toBe(resources);
      expect(machine.pickR).toHaveBeenCalledWith("it", "common");
    });

    it("delegates to rMachine.pickR when locale is resolved from header", async () => {
      mockHeadersMap.set("x-rm-locale", "it");
      const machine = createMockMachine();
      const toolset = await createNextAppServerToolset(
        machine,
        createMockImpl({ autoLocaleBinding: true }),
        MockNextClientRMachine
      );

      await toolset.pickR("common");

      expect(machine.pickR).toHaveBeenCalledWith("it", "common");
    });

    it("throws ERR_LOCALE_UNDETERMINED when locale is not bound and autoLocaleBinding is false", async () => {
      const toolset = await createToolset(undefined, { autoLocaleBinding: false });

      const error = await expectAsyncError(() => toolset.pickR("common"), RMachineUsageError);
      expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
    });
  });

  // -----------------------------------------------------------------------
  // pickRKit
  // -----------------------------------------------------------------------

  describe("pickRKit", () => {
    it("delegates to rMachine.pickRKit with bound locale", async () => {
      const kit = [{ greeting: "hello" }, { home: "Home" }];
      const machine = createMockMachine({
        pickRKit: () => Promise.resolve(kit),
      });
      const toolset = await createNextAppServerToolset(machine, createMockImpl(), MockNextClientRMachine);

      toolset.bindLocale("en");
      const result = await toolset.pickRKit("common", "nav");

      expect(result).toBe(kit);
      expect(machine.pickRKit).toHaveBeenCalledWith("en", "common", "nav");
    });

    it("delegates to rMachine.pickRKit when locale is resolved from header", async () => {
      mockHeadersMap.set("x-rm-locale", "en");
      const machine = createMockMachine();
      const toolset = await createNextAppServerToolset(
        machine,
        createMockImpl({ autoLocaleBinding: true }),
        MockNextClientRMachine
      );

      await toolset.pickRKit("common", "nav");

      expect(machine.pickRKit).toHaveBeenCalledWith("en", "common", "nav");
    });

    it("throws ERR_LOCALE_UNDETERMINED when locale is not bound and autoLocaleBinding is false", async () => {
      const toolset = await createToolset(undefined, { autoLocaleBinding: false });

      const error = await expectAsyncError(() => toolset.pickRKit("common", "nav"), RMachineUsageError);
      expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
    });
  });

  // -----------------------------------------------------------------------
  // NextServerRMachine
  // -----------------------------------------------------------------------

  describe("NextServerRMachine", () => {
    it("renders NextClientRMachine with the resolved locale", async () => {
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

    it("resolves locale from header when autoLocaleBinding is enabled", async () => {
      mockHeadersMap.set("x-rm-locale", "it");
      const toolset = await createToolset(undefined, { autoLocaleBinding: true });

      const element = (await toolset.NextServerRMachine({ children: "ciao" })) as {
        props: { locale: string };
      };

      expect(element.props.locale).toBe("it");
    });

    it("throws ERR_LOCALE_UNDETERMINED when locale is not bound and autoLocaleBinding is false", async () => {
      const toolset = await createToolset(undefined, { autoLocaleBinding: false });

      const error = await expectAsyncError(() => toolset.NextServerRMachine({ children: "test" }), RMachineUsageError);
      expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
    });

    it("throws ERR_LOCALE_UNDETERMINED when autoLocaleBinding is enabled but header is missing", async () => {
      const toolset = await createToolset(undefined, { autoLocaleBinding: true });

      const error = await expectAsyncError(() => toolset.NextServerRMachine({ children: "test" }), RMachineUsageError);
      expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
    });
  });

  // -----------------------------------------------------------------------
  // validateServerOnlyUsage
  // -----------------------------------------------------------------------

  describe("validateServerOnlyUsage", () => {
    it.each<[string, (t: Awaited<ReturnType<typeof createToolset>>) => void | Promise<void>]>([
      [
        "bindLocale",
        (t) => {
          t.bindLocale("en");
        },
      ],
      [
        "getLocale",
        async (t) => {
          t.bindLocale("en");
          await t.getLocale();
        },
      ],
      [
        "setLocale",
        async (t) => {
          t.bindLocale("en");
          await t.setLocale("it");
        },
      ],
      [
        "pickR",
        async (t) => {
          t.bindLocale("en");
          await t.pickR("common");
        },
      ],
      [
        "pickRKit",
        async (t) => {
          t.bindLocale("en");
          await t.pickRKit("common");
        },
      ],
      [
        "NextServerRMachine",
        async (t) => {
          t.bindLocale("en");
          await t.NextServerRMachine({ children: "test" });
        },
      ],
    ])("%s calls validateServerOnlyUsage", async (methodName, invoke) => {
      const toolset = await createToolset();
      await invoke(toolset);
      expect(vi.mocked(internal.validateServerOnlyUsage)).toHaveBeenCalledWith(methodName);
    });
  });
});

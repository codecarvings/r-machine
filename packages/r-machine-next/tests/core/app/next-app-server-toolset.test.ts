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
import { type CreateMockMachineOptions, createMockMachine, spies } from "../../_fixtures/mock-machine.js";

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

// Mock the scope-registry module (dynamic import inside NextServerRMachine)
const mockRegisterScope = vi.fn();
const mockUnregisterScope = vi.fn();
const mockLookupScope = vi.fn();

vi.mock("../../../src/core/app/scope-registry.js", () => ({
  registerScope: (...args: unknown[]) => mockRegisterScope(...args),
  unregisterScope: (...args: unknown[]) => mockUnregisterScope(...args),
  lookupScope: (...args: unknown[]) => mockLookupScope(...args),
}));

// Mock the request-scope module (dynamic import inside createNextAppServerToolset)
vi.mock("../../../src/core/app/request-scope.js", () => ({
  nextRequestScopeProvider: {},
}));

// Mock next/server `after` — invoke the callback synchronously so
// NextServerRMachine's cleanup runs within the test.
const mockAfter = vi.fn((cb: () => void) => cb());

vi.mock("next/server", () => ({
  after: (...args: unknown[]) => mockAfter(args[0] as () => void),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_SERVER_KIT = {} as const;

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
    createPathComposer: overrides.createPathComposer ?? vi.fn(() => vi.fn(() => "/")),
  };
}

const MockNextClientRMachine = vi.fn(
  ({ children }: { locale: string; scopeId: string; children: ReactNode }): ReactNode => children
) as unknown as NextAppClientRMachine<TestLocale>;

async function createToolset(
  machineOverrides?: CreateMockMachineOptions,
  implOverrides?: Partial<NextAppServerImpl<TestLocale, string>>
) {
  return createNextAppServerToolset(
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

  it("installs nextRequestScopeProvider on rMachine.requestScope", async () => {
    const machine = createMockMachine();
    await createNextAppServerToolset(machine, TEST_SERVER_KIT, createMockImpl(), MockNextClientRMachine);

    expect(spies(machine).requestScope.installProvider).toHaveBeenCalledTimes(1);
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
      const toolset = await createNextAppServerToolset(
        machine,
        TEST_SERVER_KIT,
        createMockImpl(),
        MockNextClientRMachine
      );

      toolset.bindLocale("en");
      toolset.bindLocale("en");

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledTimes(1);
    });

    it("reuses the locale cache across sync and async bindLocale calls", async () => {
      const machine = createMockMachine();
      const toolset = await createNextAppServerToolset(
        machine,
        TEST_SERVER_KIT,
        createMockImpl(),
        MockNextClientRMachine
      );

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
  // setLocale
  // -----------------------------------------------------------------------

  describe("setLocale", () => {
    it("calls impl.writeLocale with undefined as current locale (setLocale does not read from context)", async () => {
      const writeLocale = vi.fn();
      const toolset = await createToolset(undefined, {
        writeLocale,
        autoLocaleBinding: false,
      });

      toolset.bindLocale("en");
      await toolset.setLocale("it");

      // setLocale always passes undefined as the current locale (it does not read from context)
      expect(writeLocale).toHaveBeenCalledTimes(1);
      expect(writeLocale).toHaveBeenCalledWith(undefined, "it", expect.any(Function), expect.any(Function));
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
  });

  // -----------------------------------------------------------------------
  // ServerPlug
  // -----------------------------------------------------------------------

  describe("ServerPlug", () => {
    describe("useR()", () => {
      it("resolves with the locale from bindLocale when called with no args", async () => {
        const machine = createMockMachine();
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        toolset.bindLocale("en");
        const plug = toolset.ServerPlug("common");
        await plug.useR();

        expect(spies(machine).getGatePlugin).toHaveBeenCalledWith(
          TEST_SERVER_KIT,
          expect.anything(),
          "en",
          expect.any(Function)
        );
      });

      it("resolves with locale from x-rm-locale header when autoLocaleBinding is true and no arg given", async () => {
        mockHeadersMap.set("x-rm-locale", "it");
        const machine = createMockMachine();
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl({ autoLocaleBinding: true }),
          MockNextClientRMachine
        );

        const plug = toolset.ServerPlug("common");
        await plug.useR();

        expect(spies(machine).getGatePlugin).toHaveBeenCalledWith(
          TEST_SERVER_KIT,
          expect.anything(),
          "it",
          expect.any(Function)
        );
      });

      it("throws ERR_LOCALE_UNDETERMINED when no locale is bound and autoLocaleBinding is false", async () => {
        const toolset = await createToolset(undefined, { autoLocaleBinding: false });

        const plug = toolset.ServerPlug("common");
        const error = await expectAsyncError(() => plug.useR(), RMachineUsageError);
        expect(error.code).toBe(ERR_LOCALE_UNDETERMINED);
      });

      it("binds and resolves an explicit locale string when passed to useR", async () => {
        const machine = createMockMachine();
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        const plug = toolset.ServerPlug("common");
        await plug.useR("it");

        expect(spies(machine).getGatePlugin).toHaveBeenCalledWith(
          TEST_SERVER_KIT,
          expect.anything(),
          "it",
          expect.any(Function)
        );
      });

      it("awaits a params promise, extracts locale key, and resolves", async () => {
        const machine = createMockMachine();
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        const plug = toolset.ServerPlug("common");
        await plug.useR(Promise.resolve({ locale: "it" }));

        expect(spies(machine).getGatePlugin).toHaveBeenCalledWith(
          TEST_SERVER_KIT,
          expect.anything(),
          "it",
          expect.any(Function)
        );
      });

      it("augmentCtx sets $.locale on the plugin context", async () => {
        let capturedLocale: string | undefined;
        const machine = createMockMachine({
          getGatePlugin: (_kit, _nsDeps, _locale, augmentCtx) => {
            const $ = {} as Record<string, unknown>;
            (augmentCtx as ($: Record<string, unknown>) => void)($);
            capturedLocale = $.locale as string;
            return Promise.resolve({});
          },
        });
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        toolset.bindLocale("en");
        await toolset.ServerPlug("common").useR();

        expect(capturedLocale).toBe("en");
      });

      it("augmentCtx sets $.getPath to impl.createPathComposer result", async () => {
        const composer = vi.fn(() => "/");
        const createPathComposer = vi.fn(() => composer);
        let capturedGetPath: unknown;
        const machine = createMockMachine({
          getGatePlugin: (_kit, _nsDeps, _locale, augmentCtx) => {
            const $ = {} as Record<string, unknown>;
            (augmentCtx as ($: Record<string, unknown>) => void)($);
            capturedGetPath = $.getPath;
            return Promise.resolve({});
          },
        });
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl({ createPathComposer }),
          MockNextClientRMachine
        );

        toolset.bindLocale("en");
        await toolset.ServerPlug("common").useR();

        expect(capturedGetPath).toBe(composer);
        expect(createPathComposer).toHaveBeenCalledWith("en");
      });

      it("augmentCtx sets $.params when useR is called with a params promise", async () => {
        let capturedParams: unknown;
        const machine = createMockMachine({
          getGatePlugin: (_kit, _nsDeps, _locale, augmentCtx) => {
            const $ = {} as Record<string, unknown>;
            (augmentCtx as ($: Record<string, unknown>) => void)($);
            capturedParams = $.params;
            return Promise.resolve({});
          },
        });
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        await toolset.ServerPlug("common").useR(Promise.resolve({ locale: "en", id: "42" }));

        expect(capturedParams).toEqual({ locale: "en", id: "42" });
      });

      it("does not set $.params when useR is called with a locale string", async () => {
        let capturedParams: unknown = "UNSET";
        const machine = createMockMachine({
          getGatePlugin: (_kit, _nsDeps, _locale, augmentCtx) => {
            const $ = {} as Record<string, unknown>;
            (augmentCtx as ($: Record<string, unknown>) => void)($);
            capturedParams = $.params;
            return Promise.resolve({});
          },
        });
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        await toolset.ServerPlug("common").useR("en");

        expect(capturedParams).toBeUndefined();
      });
    });

    describe("useUnboundR()", () => {
      it("resolves with an explicit locale string without binding the context", async () => {
        const machine = createMockMachine();
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        const plug = toolset.ServerPlug("common");
        await plug.useUnboundR("it");

        expect(spies(machine).getGatePlugin).toHaveBeenCalledWith(
          TEST_SERVER_KIT,
          expect.anything(),
          "it",
          expect.any(Function)
        );
        // Context locale should not be bound — a second call with a different
        // locale should not throw ERR_LOCALE_BIND_CONFLICT.
        await expect(plug.useUnboundR("en")).resolves.toBeDefined();
      });

      it("throws an error for an invalid locale", async () => {
        const toolset = await createToolset();

        const plug = toolset.ServerPlug("common");
        // getValidLocale rethrows the raw RMachineConfigError from validateLocale
        const error = await expectAsyncError(() => plug.useUnboundR("xx"), RMachineConfigError);
        expect(error.code).toBe(ERR_UNKNOWN_LOCALE);
      });

      it("awaits a params promise and uses the locale without binding", async () => {
        const machine = createMockMachine();
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        const plug = toolset.ServerPlug("common");
        await plug.useUnboundR(Promise.resolve({ locale: "it" }));

        expect(spies(machine).getGatePlugin).toHaveBeenCalledWith(
          TEST_SERVER_KIT,
          expect.anything(),
          "it",
          expect.any(Function)
        );
      });

      it("augmentCtx sets $.params when called with a params promise", async () => {
        let capturedParams: unknown;
        const machine = createMockMachine({
          getGatePlugin: (_kit, _nsDeps, _locale, augmentCtx) => {
            const $ = {} as Record<string, unknown>;
            (augmentCtx as ($: Record<string, unknown>) => void)($);
            capturedParams = $.params;
            return Promise.resolve({});
          },
        });
        const toolset = await createNextAppServerToolset(
          machine,
          TEST_SERVER_KIT,
          createMockImpl(),
          MockNextClientRMachine
        );

        await toolset.ServerPlug("common").useUnboundR(Promise.resolve({ locale: "en", slug: "about" }));

        expect(capturedParams).toEqual({ locale: "en", slug: "about" });
      });
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
        props: { locale: string; scopeId: string; children: ReactNode };
      };

      expect(element.type).toBe(MockNextClientRMachine);
      expect(element.props.locale).toBe("en");
      expect(element.props.children).toBe("hello");
    });

    it("passes a scopeId string to NextClientRMachine", async () => {
      const toolset = await createToolset();
      toolset.bindLocale("en");

      const uuid = "test-uuid-1234";
      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(uuid as ReturnType<typeof crypto.randomUUID>);

      const element = (await toolset.NextServerRMachine({ children: "hello" })) as {
        props: { scopeId: string };
      };

      expect(element.props.scopeId).toBe(uuid);
    });

    it("registers and unregisters the scope around the response", async () => {
      const toolset = await createToolset();
      toolset.bindLocale("en");

      // after() mock invokes cb synchronously, so unregister fires within this call
      await toolset.NextServerRMachine({ children: "test" });

      expect(mockRegisterScope).toHaveBeenCalledTimes(1);
      expect(mockUnregisterScope).toHaveBeenCalledTimes(1);
    });

    it("calls rMachine.requestScope.dispose with the scope", async () => {
      const machine = createMockMachine();
      const toolset = await createNextAppServerToolset(
        machine,
        TEST_SERVER_KIT,
        createMockImpl(),
        MockNextClientRMachine
      );
      toolset.bindLocale("en");

      await toolset.NextServerRMachine({ children: "test" });

      expect(spies(machine).requestScope.dispose).toHaveBeenCalledTimes(1);
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
        "setLocale",
        async (t) => {
          await t.setLocale("it");
        },
      ],
      [
        "NextServerRMachine",
        async (t) => {
          t.bindLocale("en");
          await t.NextServerRMachine({ children: "test" });
        },
      ],
      [
        "ServerPlug.useR",
        async (t) => {
          t.bindLocale("en");
          await t.ServerPlug("common").useR();
        },
      ],
      [
        "ServerPlug.useUnboundR",
        async (t) => {
          await t.ServerPlug("common").useUnboundR("en");
        },
      ],
    ])("%s calls validateServerOnlyUsage", async (methodName, invoke) => {
      const toolset = await createToolset();
      await invoke(toolset);
      expect(vi.mocked(internal.validateServerOnlyUsage)).toHaveBeenCalledWith(methodName);
    });
  });
});

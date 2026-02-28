import type { RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineConfigError, RMachineUsageError } from "r-machine/errors";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { describe, expect, it, vi } from "vitest";
import { createReactStandardImpl } from "../../../src/core/react-standard.impl.js";
import type { ReactStandardStrategyConfig } from "../../../src/core/react-standard-strategy-core.js";
import { type TestAtlas, VALID_LOCALES } from "../../helpers/mock-machine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRMachine(defaultLocale = "en") {
  return {
    config: { defaultLocale },
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
  } as unknown as RMachine<TestAtlas>;
}

function configWith(overrides: Partial<ReactStandardStrategyConfig> = {}): ReactStandardStrategyConfig {
  return {
    localeDetector: undefined,
    localeStore: undefined,
    ...overrides,
  };
}

function syncStore(initial?: string): CustomLocaleStore & { value: string | undefined } {
  const store = {
    value: initial,
    get: vi.fn(() => store.value),
    set: vi.fn((locale: string) => {
      store.value = locale;
    }),
  };
  return store;
}

function asyncStore(initial?: string, delay = 0): CustomLocaleStore & { value: string | undefined } {
  const store = {
    value: initial,
    get: vi.fn(async () => {
      if (delay) await new Promise<void>((r) => setTimeout(r, delay));
      return store.value;
    }),
    set: vi.fn(async (locale: string) => {
      if (delay) await new Promise<void>((r) => setTimeout(r, delay));
      store.value = locale;
    }),
  };
  return store;
}

// ---------------------------------------------------------------------------
// createReactStandardImpl
// ---------------------------------------------------------------------------

describe("createReactStandardImpl", () => {
  // -----------------------------------------------------------------------
  // readLocale — no localeStore, no localeDetector (fallback to defaultLocale)
  // -----------------------------------------------------------------------

  describe("readLocale — fallback to defaultLocale", () => {
    it("returns defaultLocale when neither localeStore nor localeDetector are configured", async () => {
      const impl = await createReactStandardImpl(createMockRMachine("en"), configWith());

      expect(impl.readLocale()).toBe("en");
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — localeDetector (no localeStore)
  // -----------------------------------------------------------------------

  describe("readLocale — sync localeDetector, no localeStore", () => {
    it("returns the detected locale synchronously", async () => {
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeDetector }));

      expect(impl.readLocale()).toBe("it");
    });

    it("validates the detected locale", async () => {
      const rMachine = createMockRMachine();
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(rMachine, configWith({ localeDetector }));

      impl.readLocale();

      expect(rMachine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
    });

    it("throws RMachineUsageError with code, message and innerError when detected locale is invalid", async () => {
      const localeDetector: CustomLocaleDetector = () => "xx";
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeDetector }));

      expect(() => impl.readLocale()).toThrow(
        expect.objectContaining({
          name: "RMachineUsageError",
          code: ERR_UNKNOWN_LOCALE,
          message: expect.stringContaining("xx"),
          innerError: expect.any(RMachineConfigError),
        })
      );
    });
  });

  describe("readLocale — async localeDetector, no localeStore", () => {
    it("returns a promise that resolves to the detected locale", async () => {
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("it");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeDetector }));

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
    });

    it("rejects with RMachineUsageError when async-detected locale is invalid", async () => {
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("xx");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeDetector }));

      await expect(impl.readLocale()).rejects.toThrow(
        expect.objectContaining({
          name: "RMachineUsageError",
          code: ERR_UNKNOWN_LOCALE,
          message: expect.stringContaining("xx"),
          innerError: expect.any(RMachineConfigError),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — localeStore (sync)
  // -----------------------------------------------------------------------

  describe("readLocale — sync localeStore", () => {
    it("returns the stored locale when store.get returns a string", async () => {
      const store = syncStore("it");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      expect(impl.readLocale()).toBe("it");
    });

    it("does not call localeDetector when store has a value", async () => {
      const localeDetector = vi.fn(() => "en");
      const store = syncStore("it");
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      impl.readLocale();

      expect(localeDetector).not.toHaveBeenCalled();
    });

    it("falls back to detectAndStoreLocale when store.get returns undefined", async () => {
      const store = syncStore(undefined);
      const impl = await createReactStandardImpl(createMockRMachine("en"), configWith({ localeStore: store }));

      expect(impl.readLocale()).toBe("en");
    });

    it("stores the detected locale when store.get returns undefined", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      impl.readLocale();

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("stores the default locale when neither store nor detector have a value", async () => {
      const store = syncStore(undefined);
      const impl = await createReactStandardImpl(createMockRMachine("en"), configWith({ localeStore: store }));

      impl.readLocale();

      expect(store.set).toHaveBeenCalledWith("en");
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — localeStore (async)
  // -----------------------------------------------------------------------

  describe("readLocale — async localeStore", () => {
    it("returns a promise that resolves to the stored locale", async () => {
      const store = asyncStore("it");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
    });

    it("falls back to detectAndStoreLocale when async store.get resolves to undefined", async () => {
      const store = asyncStore(undefined);
      const impl = await createReactStandardImpl(createMockRMachine("en"), configWith({ localeStore: store }));

      await expect(impl.readLocale()).resolves.toBe("en");
    });

    it("stores the detected locale when async store.get resolves to undefined", async () => {
      const store = asyncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      await impl.readLocale();

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("does not call localeDetector when async store has a value", async () => {
      const localeDetector = vi.fn(() => "en");
      const store = asyncStore("it");
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      await impl.readLocale();

      expect(localeDetector).not.toHaveBeenCalled();
    });

    it("awaits async store.set before resolving", async () => {
      const order: string[] = [];
      const store: CustomLocaleStore = {
        get: () => undefined,
        set: async () => {
          await new Promise<void>((r) => setTimeout(r, 10));
          order.push("set-done");
        },
      };
      const impl = await createReactStandardImpl(createMockRMachine("en"), configWith({ localeStore: store }));

      await impl.readLocale();
      order.push("readLocale-done");

      expect(order).toEqual(["set-done", "readLocale-done"]);
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — localeDetector + localeStore combinations
  // -----------------------------------------------------------------------

  describe("readLocale — detect-and-store combinations", () => {
    it("sync detector + sync store: detects, validates, stores, and returns locale", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "it";
      const rMachine = createMockRMachine();
      const impl = await createReactStandardImpl(rMachine, configWith({ localeStore: store, localeDetector }));

      const result = impl.readLocale();

      expect(result).toBe("it");
      expect(rMachine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("sync detector + async store: returns a promise resolving to the detected locale", async () => {
      const store = asyncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("async detector + sync store: returns a promise resolving to the detected locale", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("it");
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("async detector + async store: returns a promise resolving to the detected locale", async () => {
      const store = asyncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("it");
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("does not store locale when detection fails (sync detector)", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "xx";
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      expect(() => impl.readLocale()).toThrow(RMachineUsageError);
      expect(store.set).not.toHaveBeenCalled();
    });

    it("does not store locale when detection fails (async detector)", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("xx");
      const impl = await createReactStandardImpl(
        createMockRMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      await expect(impl.readLocale()).rejects.toThrow(RMachineUsageError);
      expect(store.set).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — no store validation
  // -----------------------------------------------------------------------

  describe("readLocale — no store validation", () => {
    it("does not validate the locale returned by a sync store", async () => {
      const rMachine = createMockRMachine();
      const store = syncStore("xx");
      const impl = await createReactStandardImpl(rMachine, configWith({ localeStore: store }));

      expect(impl.readLocale()).toBe("xx");
      expect(rMachine.localeHelper.validateLocale).not.toHaveBeenCalled();
    });

    it("does not validate the locale returned by an async store", async () => {
      const rMachine = createMockRMachine();
      const store = asyncStore("xx");
      const impl = await createReactStandardImpl(rMachine, configWith({ localeStore: store }));

      await expect(impl.readLocale()).resolves.toBe("xx");
      expect(rMachine.localeHelper.validateLocale).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — repeated calls
  // -----------------------------------------------------------------------

  describe("readLocale — repeated calls", () => {
    it("calls store.get on every invocation (no internal caching)", async () => {
      const store = syncStore("en");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      impl.readLocale();
      impl.readLocale();

      expect(store.get).toHaveBeenCalledTimes(2);
    });

    it("reflects store mutations between calls", async () => {
      const store = syncStore("en");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      expect(impl.readLocale()).toBe("en");

      store.value = "it";
      expect(impl.readLocale()).toBe("it");
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — error propagation
  // -----------------------------------------------------------------------

  describe("readLocale — error propagation", () => {
    it("propagates errors thrown by a sync localeDetector", async () => {
      const localeDetector: CustomLocaleDetector = () => {
        throw new Error("detector crashed");
      };
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeDetector }));

      expect(() => impl.readLocale()).toThrow("detector crashed");
    });

    it("propagates rejections from an async localeDetector", async () => {
      const localeDetector: CustomLocaleDetector = () => Promise.reject(new Error("detector failed"));
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeDetector }));

      await expect(impl.readLocale()).rejects.toThrow("detector failed");
    });

    it("propagates errors thrown by sync store.get", async () => {
      const store: CustomLocaleStore = {
        get: () => {
          throw new Error("storage unavailable");
        },
        set: vi.fn(),
      };
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      expect(() => impl.readLocale()).toThrow("storage unavailable");
    });

    it("propagates rejections from async store.get", async () => {
      const store: CustomLocaleStore = {
        get: () => Promise.reject(new Error("storage unavailable")),
        set: vi.fn(),
      };
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      await expect(impl.readLocale()).rejects.toThrow("storage unavailable");
    });
  });

  // -----------------------------------------------------------------------
  // writeLocale
  // -----------------------------------------------------------------------

  describe("writeLocale", () => {
    it("returns undefined when no localeStore is configured", async () => {
      const impl = await createReactStandardImpl(createMockRMachine(), configWith());

      expect(impl.writeLocale("it")).toBeUndefined();
    });

    it("calls localeStore.set with the new locale", async () => {
      const store = syncStore("en");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      impl.writeLocale("it");

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("returns the promise from an async localeStore.set", async () => {
      const store = asyncStore("en");
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      const result = impl.writeLocale("it");

      expect(result).toBeInstanceOf(Promise);
      await result;
      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("propagates errors thrown by sync localeStore.set", async () => {
      const store: CustomLocaleStore = {
        get: () => "en",
        set: () => {
          throw new Error("write failed");
        },
      };
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      expect(() => impl.writeLocale("it")).toThrow("write failed");
    });

    it("propagates rejections from async localeStore.set", async () => {
      const store: CustomLocaleStore = {
        get: () => "en",
        set: () => Promise.reject(new Error("network error")),
      };
      const impl = await createReactStandardImpl(createMockRMachine(), configWith({ localeStore: store }));

      await expect(impl.writeLocale("it")).rejects.toThrow("network error");
    });

    it("does not validate the locale (validation is the caller's responsibility)", async () => {
      const rMachine = createMockRMachine();
      const store = syncStore("en");
      const impl = await createReactStandardImpl(rMachine, configWith({ localeStore: store }));

      impl.writeLocale("xx");

      expect(rMachine.localeHelper.validateLocale).not.toHaveBeenCalled();
      expect(store.set).toHaveBeenCalledWith("xx");
    });
  });
});

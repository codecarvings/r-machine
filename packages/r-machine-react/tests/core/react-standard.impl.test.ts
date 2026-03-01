import { ERR_UNKNOWN_LOCALE, RMachineConfigError, RMachineUsageError } from "r-machine/errors";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { describe, expect, it, vi } from "vitest";
import { createReactStandardImpl } from "../../src/core/react-standard.impl.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";
import { asyncStore, configWith, syncStore } from "../_fixtures/mock-strategy-config.js";

// ---------------------------------------------------------------------------
// createReactStandardImpl
// ---------------------------------------------------------------------------

describe("createReactStandardImpl", () => {
  // -----------------------------------------------------------------------
  // readLocale — no localeStore, no localeDetector (fallback to defaultLocale)
  // -----------------------------------------------------------------------

  describe("readLocale — fallback to defaultLocale", () => {
    it("returns defaultLocale when neither localeStore nor localeDetector are configured", async () => {
      const impl = await createReactStandardImpl(createMockMachine({ defaultLocale: "en" }), configWith());

      expect(impl.readLocale()).toBe("en");
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — localeDetector (no localeStore)
  // -----------------------------------------------------------------------

  describe("readLocale — sync localeDetector, no localeStore", () => {
    it("returns the detected locale synchronously", async () => {
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeDetector }));

      expect(impl.readLocale()).toBe("it");
    });

    it("validates the detected locale", async () => {
      const rMachine = createMockMachine();
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(rMachine, configWith({ localeDetector }));

      impl.readLocale();

      expect(rMachine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
    });

    it("throws RMachineUsageError with code, message and innerError when detected locale is invalid", async () => {
      const localeDetector: CustomLocaleDetector = () => "xx";
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeDetector }));

      try {
        impl.readLocale();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
        expect(error).toHaveProperty("code", ERR_UNKNOWN_LOCALE);
        expect(error).toHaveProperty("message", expect.stringContaining("xx"));
        expect(error).toHaveProperty("innerError", expect.any(RMachineConfigError));
      }
    });
  });

  describe("readLocale — async localeDetector, no localeStore", () => {
    it("returns a promise that resolves to the detected locale", async () => {
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("it");
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeDetector }));

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
    });

    it("rejects with RMachineUsageError when async-detected locale is invalid", async () => {
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("xx");
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeDetector }));

      try {
        await impl.readLocale();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
        expect(error).toHaveProperty("code", ERR_UNKNOWN_LOCALE);
        expect(error).toHaveProperty("message", expect.stringContaining("xx"));
        expect(error).toHaveProperty("innerError", expect.any(RMachineConfigError));
      }
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — localeStore (sync)
  // -----------------------------------------------------------------------

  describe("readLocale — sync localeStore", () => {
    it("returns the stored locale when store.get returns a string", async () => {
      const store = syncStore("it");
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      expect(impl.readLocale()).toBe("it");
    });

    it("does not call localeDetector when store has a value", async () => {
      const localeDetector = vi.fn(() => "en");
      const store = syncStore("it");
      const impl = await createReactStandardImpl(
        createMockMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      impl.readLocale();

      expect(localeDetector).not.toHaveBeenCalled();
    });

    it("falls back to detectAndStoreLocale when store.get returns undefined", async () => {
      const store = syncStore(undefined);
      const impl = await createReactStandardImpl(
        createMockMachine({ defaultLocale: "en" }),
        configWith({ localeStore: store })
      );

      expect(impl.readLocale()).toBe("en");
    });

    it("stores the detected locale when store.get returns undefined", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(
        createMockMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      impl.readLocale();

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("stores the default locale when neither store nor detector have a value", async () => {
      const store = syncStore(undefined);
      const impl = await createReactStandardImpl(
        createMockMachine({ defaultLocale: "en" }),
        configWith({ localeStore: store })
      );

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
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      const result = impl.readLocale();

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe("it");
    });

    it("falls back to detectAndStoreLocale when async store.get resolves to undefined", async () => {
      const store = asyncStore(undefined);
      const impl = await createReactStandardImpl(
        createMockMachine({ defaultLocale: "en" }),
        configWith({ localeStore: store })
      );

      await expect(impl.readLocale()).resolves.toBe("en");
    });

    it("stores the detected locale when async store.get resolves to undefined", async () => {
      const store = asyncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => "it";
      const impl = await createReactStandardImpl(
        createMockMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      await impl.readLocale();

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("does not call localeDetector when async store has a value", async () => {
      const localeDetector = vi.fn(() => "en");
      const store = asyncStore("it");
      const impl = await createReactStandardImpl(
        createMockMachine(),
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
      const impl = await createReactStandardImpl(
        createMockMachine({ defaultLocale: "en" }),
        configWith({ localeStore: store })
      );

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
      const rMachine = createMockMachine();
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
        createMockMachine(),
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
        createMockMachine(),
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
        createMockMachine(),
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
        createMockMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      try {
        impl.readLocale();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
      }
      expect(store.set).not.toHaveBeenCalled();
    });

    it("does not store locale when detection fails (async detector)", async () => {
      const store = syncStore(undefined);
      const localeDetector: CustomLocaleDetector = () => Promise.resolve("xx");
      const impl = await createReactStandardImpl(
        createMockMachine(),
        configWith({ localeStore: store, localeDetector })
      );

      try {
        await impl.readLocale();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
      }
      expect(store.set).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // readLocale — no store validation
  // -----------------------------------------------------------------------

  describe("readLocale — no store validation", () => {
    it("does not validate the locale returned by a sync store", async () => {
      const rMachine = createMockMachine();
      const store = syncStore("xx");
      const impl = await createReactStandardImpl(rMachine, configWith({ localeStore: store }));

      expect(impl.readLocale()).toBe("xx");
      expect(rMachine.localeHelper.validateLocale).not.toHaveBeenCalled();
    });

    it("does not validate the locale returned by an async store", async () => {
      const rMachine = createMockMachine();
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
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      impl.readLocale();
      impl.readLocale();

      expect(store.get).toHaveBeenCalledTimes(2);
    });

    it("reflects store mutations between calls", async () => {
      const store = syncStore("en");
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

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
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeDetector }));

      expect(() => impl.readLocale()).toThrow("detector crashed");
    });

    it("propagates rejections from an async localeDetector", async () => {
      const localeDetector: CustomLocaleDetector = () => Promise.reject(new Error("detector failed"));
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeDetector }));

      await expect(impl.readLocale()).rejects.toThrow("detector failed");
    });

    it("propagates errors thrown by sync store.get", async () => {
      const store: CustomLocaleStore = {
        get: () => {
          throw new Error("storage unavailable");
        },
        set: vi.fn(),
      };
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      expect(() => impl.readLocale()).toThrow("storage unavailable");
    });

    it("propagates rejections from async store.get", async () => {
      const store: CustomLocaleStore = {
        get: () => Promise.reject(new Error("storage unavailable")),
        set: vi.fn(),
      };
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      await expect(impl.readLocale()).rejects.toThrow("storage unavailable");
    });
  });

  // -----------------------------------------------------------------------
  // writeLocale
  // -----------------------------------------------------------------------

  describe("writeLocale", () => {
    it("returns undefined when no localeStore is configured", async () => {
      const impl = await createReactStandardImpl(createMockMachine(), configWith());

      expect(impl.writeLocale("it")).toBeUndefined();
    });

    it("calls localeStore.set with the new locale", async () => {
      const store = syncStore("en");
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      impl.writeLocale("it");

      expect(store.set).toHaveBeenCalledWith("it");
    });

    it("returns the promise from an async localeStore.set", async () => {
      const store = asyncStore("en");
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

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
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      expect(() => impl.writeLocale("it")).toThrow("write failed");
    });

    it("propagates rejections from async localeStore.set", async () => {
      const store: CustomLocaleStore = {
        get: () => "en",
        set: () => Promise.reject(new Error("network error")),
      };
      const impl = await createReactStandardImpl(createMockMachine(), configWith({ localeStore: store }));

      await expect(impl.writeLocale("it")).rejects.toThrow("network error");
    });

    it("does not validate the locale (validation is the caller's responsibility)", async () => {
      const rMachine = createMockMachine();
      const store = syncStore("en");
      const impl = await createReactStandardImpl(rMachine, configWith({ localeStore: store }));

      impl.writeLocale("xx");

      expect(rMachine.localeHelper.validateLocale).not.toHaveBeenCalled();
      expect(store.set).toHaveBeenCalledWith("xx");
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import { RMachineError } from "#r-machine/errors";
import { RMachine } from "../../../src/lib/r-machine.js";
import type { RMachineConfig } from "../../../src/lib/r-machine-config.js";
import type { AnyRModule, RModuleResolver } from "../../../src/lib/r-module.js";
import { createDelayedResolver, createMockResolver } from "../_fixtures/resolver-helpers.js";

const commonR = { greeting: "hello" };
const navR = { home: "Home", about: "About" };
const footerR = { copyright: "2024" };

const enModules: Record<string, AnyRModule> = {
  common: { default: commonR },
  nav: { default: navR },
  footer: { default: footerR },
};

const itCommonR = { greeting: "ciao" };
const itNavR = { home: "Casa", about: "Chi siamo" };

const itModules: Record<string, AnyRModule> = {
  common: { default: itCommonR },
  nav: { default: itNavR },
};

const allModules: Record<string, Record<string, AnyRModule>> = {
  en: enModules,
  it: itModules,
};

function makeConfig(overrides: Partial<RMachineConfig> = {}): RMachineConfig {
  return {
    locales: ["en", "it"],
    defaultLocale: "en",
    rModuleResolver: createMockResolver(allModules),
    ...overrides,
  };
}

function createMachine(overrides: Partial<RMachineConfig> = {}) {
  return new RMachine(makeConfig(overrides));
}

describe("RMachine", () => {
  describe("constructor", () => {
    it("creates an instance with a valid config", () => {
      const machine = createMachine();
      expect(machine).toBeInstanceOf(RMachine);
    });

    it("throws for an empty locales array", () => {
      expect(() => createMachine({ locales: [] })).toThrow(RMachineError);
    });

    it("throws for a non-canonical locale id", () => {
      expect(() => createMachine({ locales: ["EN", "it"], defaultLocale: "EN" })).toThrow(RMachineError);
    });

    it("throws for duplicate locales", () => {
      expect(() => createMachine({ locales: ["en", "en"] })).toThrow(RMachineError);
    });

    it("throws when defaultLocale is not in the locales list", () => {
      expect(() => createMachine({ locales: ["en", "it"], defaultLocale: "fr" })).toThrow(RMachineError);
    });

    it("throws when defaultLocale is not a valid canonical locale id", () => {
      expect(() => createMachine({ locales: ["en"], defaultLocale: "EN" })).toThrow(RMachineError);
    });

    it("accepts a single locale configuration", () => {
      const machine = new RMachine({
        locales: ["en"],
        defaultLocale: "en",
        rModuleResolver: createMockResolver({ en: { common: { default: commonR } } }),
      });
      expect(machine.config.locales).toEqual(["en"]);
    });
  });

  describe("config", () => {
    it("exposes the config as a readonly property", () => {
      const machine = createMachine();
      expect(machine.config.locales).toEqual(["en", "it"]);
      expect(machine.config.defaultLocale).toBe("en");
    });
  });

  describe("localeHelper", () => {
    it("exposes a working localeHelper", () => {
      const machine = createMachine();
      expect(machine.localeHelper).toBeDefined();
      expect(machine.localeHelper.validateLocale("en")).toBeNull();
      expect(machine.localeHelper.validateLocale("fr")).toBeInstanceOf(RMachineError);
    });
  });

  describe("locale validation across methods", () => {
    it("throws synchronously before the resolver is called", () => {
      const resolver = vi.fn<RModuleResolver>();
      const machine = createMachine({ rModuleResolver: resolver });

      expect(() => machine.pickR("fr", "common")).toThrow(RMachineError);
      expect(() => machine.pickRKit("fr", "common")).toThrow(RMachineError);
      expect(resolver).not.toHaveBeenCalled();
    });

    it("throws with a descriptive message and inner error for invalid locale", () => {
      const machine = createMachine();
      try {
        machine.pickR("fr", "common");
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect((error as RMachineError).message).toMatch(/Cannot use invalid locale: "fr"/);
        const inner = (error as RMachineError).innerError;
        expect(inner).toBeInstanceOf(RMachineError);
        expect((inner as RMachineError).message).toContain("is not in the list of locales");
      }
    });

    it("validates locale consistently across pickR and pickRKit", () => {
      const machine = createMachine();
      for (const locale of ["fr", "de", "", "EN"]) {
        expect(() => machine.pickR(locale, "common"), `pickR should reject "${locale}"`).toThrow(RMachineError);
        expect(() => machine.pickRKit(locale, "common"), `pickRKit should reject "${locale}"`).toThrow(RMachineError);
      }
    });
  });

  describe("pickR", () => {
    it("resolves a resource for a valid locale and namespace", async () => {
      const machine = createMachine();
      expect(await machine.pickR("en", "common")).toBe(commonR);
      expect(await machine.pickR("it", "common")).toBe(itCommonR);
    });

    it("resolves different namespaces independently", async () => {
      const machine = createMachine();
      expect(await machine.pickR("en", "common")).toBe(commonR);
      expect(await machine.pickR("en", "nav")).toBe(navR);
    });

    it("rejects when the resolver rejects", async () => {
      const machine = createMachine();
      await expect(machine.pickR("en", "nonexistent")).rejects.toThrow();
    });

    it("calls the resolver with the correct arguments", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: {} }));
      const machine = createMachine({ rModuleResolver: resolver });
      await machine.pickR("en", "common");
      expect(resolver).toHaveBeenCalledWith("common", "en");
    });

    it("works with a delayed resolver", async () => {
      const machine = createMachine({ rModuleResolver: createDelayedResolver(allModules) });
      expect(await machine.pickR("en", "common")).toBe(commonR);
    });

    it("can be destructured and called without losing context", async () => {
      const { pickR } = createMachine();
      expect(await pickR("en", "common")).toBe(commonR);
    });
  });

  describe("pickRKit", () => {
    it("resolves a kit with multiple namespaces", async () => {
      const machine = createMachine();
      expect(await machine.pickRKit("en", "common", "nav", "footer")).toEqual([commonR, navR, footerR]);
    });

    it("resolves a kit for a different locale", async () => {
      const machine = createMachine();
      expect(await machine.pickRKit("it", "common", "nav")).toEqual([itCommonR, itNavR]);
    });

    it("returns empty array when called with no namespaces", async () => {
      const machine = createMachine();
      expect(await machine.pickRKit("en")).toEqual([]);
    });

    it("rejects when the resolver rejects for any namespace", async () => {
      const machine = createMachine();
      await expect(machine.pickRKit("en", "common", "nonexistent")).rejects.toThrow();
    });

    it("can be destructured and called without losing context", async () => {
      const { pickRKit } = createMachine();
      expect(await pickRKit("en", "common", "nav")).toEqual([commonR, navR]);
    });
  });

  describe("pickR and pickRKit interaction", () => {
    it("shares cached resources between pickR and pickRKit", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, locale) => {
        const mod = allModules[locale]?.[namespace];
        return mod ? Promise.resolve(mod) : Promise.reject(new Error("not found"));
      });
      const machine = createMachine({ rModuleResolver: resolver });

      await machine.pickR("en", "common");
      await machine.pickRKit("en", "common", "nav");

      const commonCalls = resolver.mock.calls.filter(([ns, loc]) => ns === "common" && loc === "en");
      expect(commonCalls).toHaveLength(1);
    });

    it("does not share cache between different locales", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, locale) => {
        const mod = allModules[locale]?.[namespace];
        return mod ? Promise.resolve(mod) : Promise.reject(new Error("not found"));
      });
      const machine = createMachine({ rModuleResolver: resolver });

      await machine.pickR("en", "common");
      await machine.pickR("it", "common");

      const commonCalls = resolver.mock.calls.filter(([ns]) => ns === "common");
      expect(commonCalls).toHaveLength(2);
    });
  });

  describe("factory-based resources", () => {
    it("resolves resources from factory functions", async () => {
      const factoryR = { dynamic: true };
      const resolver: RModuleResolver = () => Promise.resolve({ default: () => factoryR });
      const machine = createMachine({ rModuleResolver: resolver });
      expect(await machine.pickR("en", "common")).toBe(factoryR);
    });

    it("resolves resources from async factory functions", async () => {
      const asyncR = { async: true };
      const resolver: RModuleResolver = () => Promise.resolve({ default: () => Promise.resolve(asyncR) });
      const machine = createMachine({ rModuleResolver: resolver });
      expect(await machine.pickR("en", "common")).toBe(asyncR);
    });
  });

  describe("resolver error handling", () => {
    it("handles resolver throwing synchronously", async () => {
      const resolver: RModuleResolver = () => {
        throw new Error("Sync error");
      };
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickR("en", "common")).rejects.toThrow("Sync error");
    });

    it("handles resolver returning a rejected promise", async () => {
      const resolver: RModuleResolver = () => Promise.reject(new Error("Async error"));
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickR("en", "common")).rejects.toThrow(RMachineError);
      await expect(machine.pickR("en", "common")).rejects.toThrow(/rModuleResolver failed/);
    });

    it("allows retry after resolver rejection", async () => {
      let callCount = 0;
      const resolver: RModuleResolver = () => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error("First call fails"));
        return Promise.resolve({ default: commonR });
      };
      const machine = createMachine({ rModuleResolver: resolver });

      await expect(machine.pickR("en", "common")).rejects.toThrow(RMachineError);
      expect(await machine.pickR("en", "common")).toBe(commonR);
      expect(callCount).toBe(2);
    });

    it("handles factory function throwing synchronously", async () => {
      const resolver: RModuleResolver = () =>
        Promise.resolve({
          default: () => {
            throw new Error("Factory error");
          },
        });
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickR("en", "common")).rejects.toThrow("Factory error");
    });

    it("handles async factory function rejecting", async () => {
      const resolver: RModuleResolver = () =>
        Promise.resolve({ default: () => Promise.reject(new Error("Async factory error")) });
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickR("en", "common")).rejects.toThrow(RMachineError);
      await expect(machine.pickR("en", "common")).rejects.toThrow(/factory promise rejected/);
    });

    it("propagates rejection for pickRKit when one namespace fails", async () => {
      const resolver: RModuleResolver = (namespace) => {
        if (namespace === "fail") return Promise.reject(new Error("Namespace fail error"));
        return Promise.resolve({ default: commonR });
      };
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickRKit("en", "common", "fail")).rejects.toThrow(RMachineError);
    });
  });

  describe("concurrent call deduplication", () => {
    it("deduplicates concurrent pickR calls to the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(
        () => new Promise((resolve) => setTimeout(() => resolve({ default: commonR }), 20))
      );
      const machine = createMachine({ rModuleResolver: resolver });

      const [r1, r2, r3] = await Promise.all([
        machine.pickR("en", "common"),
        machine.pickR("en", "common"),
        machine.pickR("en", "common"),
      ]);

      expect(r1).toBe(commonR);
      expect(r2).toBe(commonR);
      expect(r3).toBe(commonR);
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    it("does not deduplicate calls to different namespaces", async () => {
      const resolver = vi.fn<RModuleResolver>(
        (namespace) =>
          new Promise((resolve) =>
            setTimeout(() => {
              const mod = enModules[namespace];
              if (mod) resolve(mod);
            }, 20)
          )
      );
      const machine = createMachine({ rModuleResolver: resolver });

      await Promise.all([machine.pickR("en", "common"), machine.pickR("en", "nav")]);
      expect(resolver).toHaveBeenCalledTimes(2);
    });
  });

  describe("hybridPickR / hybridPickRKit (protected, via subclass)", () => {
    class TestableRMachine extends RMachine<Record<string, Record<string, unknown>>> {
      testHybridPickR(locale: string, namespace: string) {
        return this.hybridPickR(locale, namespace);
      }
      testHybridPickRKit(locale: string, ...namespaces: string[]) {
        return this.hybridPickRKit(locale, ...namespaces);
      }
    }

    it("hybridPickR returns a promise when not cached, then the value when cached", async () => {
      const machine = new TestableRMachine(makeConfig());
      const first = machine.testHybridPickR("en", "common");
      expect(first).toBeInstanceOf(Promise);
      await first;
      expect(machine.testHybridPickR("en", "common")).toBe(commonR);
    });

    it("hybridPickRKit returns a promise when not cached, then the kit when cached", async () => {
      const machine = new TestableRMachine(makeConfig());
      const first = machine.testHybridPickRKit("en", "common", "nav");
      expect(first).toBeInstanceOf(Promise);
      await first;
      expect(machine.testHybridPickRKit("en", "common", "nav")).toEqual([commonR, navR]);
    });

    it("hybridPickR throws for invalid locale", () => {
      const machine = new TestableRMachine(makeConfig());
      expect(() => machine.testHybridPickR("fr", "common")).toThrow(RMachineError);
    });

    it("hybridPickRKit throws for invalid locale", () => {
      const machine = new TestableRMachine(makeConfig());
      expect(() => machine.testHybridPickRKit("fr", "common")).toThrow(RMachineError);
    });
  });

  describe("multiple instances", () => {
    it("creates independent instances that do not share state", async () => {
      const machine1 = createMachine();
      const machine2 = createMachine({ defaultLocale: "it" });

      expect(machine1.config.defaultLocale).toBe("en");
      expect(machine2.config.defaultLocale).toBe("it");

      expect(await machine1.pickR("en", "common")).toBe(commonR);
      expect(await machine2.pickR("en", "common")).toBe(commonR);
    });
  });
});

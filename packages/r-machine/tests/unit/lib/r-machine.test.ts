import { describe, expect, it, vi } from "vitest";

import { RMachineError } from "../../../src/errors/r-machine-error.js";
import { RMachine } from "../../../src/lib/r-machine.js";
import type { RMachineConfig } from "../../../src/lib/r-machine-config.js";
import type { AnyRModule, RModuleResolver } from "../../../src/lib/r-module.js";

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

function createMockResolver(modules: Record<string, Record<string, AnyRModule>> = allModules): RModuleResolver {
  return (namespace, locale) => {
    const localeModules = modules[locale];
    if (!localeModules) {
      return Promise.reject(new Error(`No modules for locale "${locale}"`));
    }
    const mod = localeModules[namespace];
    if (!mod) {
      return Promise.reject(new Error(`No module for namespace "${namespace}" in locale "${locale}"`));
    }
    return Promise.resolve(mod);
  };
}

function createDelayedResolver(
  modules: Record<string, Record<string, AnyRModule>> = allModules,
  delayMs = 10
): RModuleResolver {
  return (namespace, locale) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const localeModules = modules[locale];
        if (!localeModules) {
          reject(new Error(`No modules for locale "${locale}"`));
          return;
        }
        const mod = localeModules[namespace];
        if (!mod) {
          reject(new Error(`No module for namespace "${namespace}" in locale "${locale}"`));
          return;
        }
        resolve(mod);
      }, delayMs);
    });
  };
}

function makeConfig(overrides: Partial<RMachineConfig> = {}): RMachineConfig {
  return {
    locales: ["en", "it"],
    defaultLocale: "en",
    rModuleResolver: createMockResolver(),
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
      expect(() =>
        createMachine({
          locales: ["en", "en"],
        })
      ).toThrow(RMachineError);
    });

    it("throws when defaultLocale is not in the locales list", () => {
      expect(() =>
        createMachine({
          locales: ["en", "it"],
          defaultLocale: "fr",
        })
      ).toThrow(RMachineError);
    });

    it("throws when defaultLocale is not a valid canonical locale id", () => {
      expect(() =>
        createMachine({
          locales: ["en"],
          defaultLocale: "EN",
        })
      ).toThrow(RMachineError);
    });

    it("accepts a single locale configuration", () => {
      const singleLocaleModules: Record<string, Record<string, AnyRModule>> = {
        en: { common: { default: commonR } },
      };
      const machine = new RMachine({
        locales: ["en"],
        defaultLocale: "en",
        rModuleResolver: createMockResolver(singleLocaleModules),
      });
      expect(machine.config.locales).toEqual(["en"]);
    });

    it("accepts many locales", () => {
      const manyLocales = ["en", "it", "fr", "de", "es", "pt", "ja", "zh", "ko", "ar"];
      const manyLocaleModules: Record<string, Record<string, AnyRModule>> = {};
      for (const locale of manyLocales) {
        manyLocaleModules[locale] = { common: { default: { locale } } };
      }
      const machine = new RMachine({
        locales: manyLocales,
        defaultLocale: "en",
        rModuleResolver: createMockResolver(manyLocaleModules),
      });
      expect(machine.config.locales).toHaveLength(10);
    });

    it("accepts locales with region subtags", () => {
      const regionalModules: Record<string, Record<string, AnyRModule>> = {
        "en-US": { common: { default: { region: "US" } } },
        "en-GB": { common: { default: { region: "GB" } } },
      };
      const machine = new RMachine({
        locales: ["en-US", "en-GB"],
        defaultLocale: "en-US",
        rModuleResolver: createMockResolver(regionalModules),
      });
      expect(machine.config.locales).toEqual(["en-US", "en-GB"]);
    });

    it("accepts locales with script subtags", () => {
      const scriptModules: Record<string, Record<string, AnyRModule>> = {
        "zh-Hans": { common: { default: { script: "Hans" } } },
        "zh-Hant": { common: { default: { script: "Hant" } } },
      };
      const machine = new RMachine({
        locales: ["zh-Hans", "zh-Hant"],
        defaultLocale: "zh-Hans",
        rModuleResolver: createMockResolver(scriptModules),
      });
      expect(machine.config.locales).toEqual(["zh-Hans", "zh-Hant"]);
    });
  });

  describe("config", () => {
    it("exposes the config as a readonly property", () => {
      const machine = createMachine();
      expect(machine.config).toBeDefined();
      expect(machine.config.locales).toEqual(["en", "it"]);
      expect(machine.config.defaultLocale).toBe("en");
    });

    describe("cloning", () => {
      it("clones the config so mutations to the original do not affect the instance", () => {
        const locales = ["en", "it"];
        const config: RMachineConfig = {
          locales,
          defaultLocale: "en",
          rModuleResolver: createMockResolver(),
        };
        const machine = new RMachine(config);
        locales.push("fr");
        expect(machine.config.locales).toEqual(["en", "it"]);
      });

      it("does not reflect changes made to the original locales array after construction", () => {
        const locales = ["en", "it"];
        const machine = new RMachine({
          locales,
          defaultLocale: "en",
          rModuleResolver: createMockResolver(),
        });

        locales.push("fr");
        expect(machine.config.locales).toEqual(["en", "it"]);
      });

      it("returns a consistent config reference", () => {
        const machine = createMachine();
        const config1 = machine.config;
        const config2 = machine.config;
        expect(config1).toBe(config2);
      });
    });
  });

  describe("localeHelper", () => {
    it("exposes a localeHelper property", () => {
      const machine = createMachine();
      expect(machine.localeHelper).toBeDefined();
    });

    describe("validateLocale", () => {
      it("validates known locales as valid", () => {
        const machine = createMachine();
        expect(machine.localeHelper.validateLocale("en")).toBeNull();
        expect(machine.localeHelper.validateLocale("it")).toBeNull();
      });

      it("validates unknown locales as invalid", () => {
        const machine = createMachine();
        const error = machine.localeHelper.validateLocale("fr");
        expect(error).toBeInstanceOf(RMachineError);
      });
    });

    describe("matchLocales", () => {
      it("matches locales from a list of requested locales", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocales(["it", "de"]);
        expect(matched).toBe("it");
      });

      it("returns default locale when no match found", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocales(["fr", "de"]);
        expect(matched).toBe("en");
      });

      it("matches first available locale from the list", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocales(["de", "en", "it"]);
        expect(matched).toBe("en");
      });

      it("handles empty requested locales array", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocales([]);
        expect(matched).toBe("en");
      });
    });

    describe("matchLocalesForAcceptLanguageHeader", () => {
      it("matches locales from Accept-Language header", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocalesForAcceptLanguageHeader("it-IT,it;q=0.9,en;q=0.8");
        expect(matched).toBe("it");
      });

      it("handles null Accept-Language header", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocalesForAcceptLanguageHeader(null);
        expect(matched).toBe("en");
      });

      it("handles undefined Accept-Language header", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocalesForAcceptLanguageHeader(undefined);
        expect(matched).toBe("en");
      });

      it("handles empty Accept-Language header", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocalesForAcceptLanguageHeader("");
        expect(matched).toBe("en");
      });

      it("handles Accept-Language header with no matching locale", () => {
        const machine = createMachine();
        const matched = machine.localeHelper.matchLocalesForAcceptLanguageHeader("fr-FR,de-DE");
        expect(matched).toBe("en");
      });
    });
  });

  describe("pickR", () => {
    it("resolves a resource for a valid locale and namespace", async () => {
      const machine = createMachine();
      const result = await machine.pickR("en", "common");
      expect(result).toBe(commonR);
    });

    it("resolves a resource for a different locale", async () => {
      const machine = createMachine();
      const result = await machine.pickR("it", "common");
      expect(result).toBe(itCommonR);
    });

    it("resolves different namespaces independently", async () => {
      const machine = createMachine();
      const common = await machine.pickR("en", "common");
      const nav = await machine.pickR("en", "nav");
      expect(common).toBe(commonR);
      expect(nav).toBe(navR);
    });

    it("throws RMachineError for an invalid locale", () => {
      const machine = createMachine();
      expect(() => machine.pickR("fr", "common")).toThrow(RMachineError);
    });

    it("throws RMachineError with a descriptive message for an invalid locale", () => {
      const machine = createMachine();
      expect(() => machine.pickR("fr", "common")).toThrow(/Cannot use invalid locale: "fr"/);
    });

    it("throws with an inner error from locale validation", () => {
      const machine = createMachine();
      try {
        machine.pickR("fr", "common");
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineError);
        expect((error as RMachineError).innerError).toBeInstanceOf(RMachineError);
      }
    });

    it("returns a promise", () => {
      const machine = createMachine();
      const result = machine.pickR("en", "common");
      expect(result).toBeInstanceOf(Promise);
    });

    it("rejects when the resolver rejects", async () => {
      const machine = createMachine();
      await expect(machine.pickR("en", "nonexistent")).rejects.toThrow();
    });

    it("calls the resolver with the correct namespace", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        return Promise.resolve({ default: { ns: namespace } });
      });
      const machine = createMachine({ rModuleResolver: resolver });
      await machine.pickR("en", "common");
      expect(resolver).toHaveBeenCalledWith("common", "en");
    });

    it("works with a delayed resolver", async () => {
      const machine = createMachine({
        rModuleResolver: createDelayedResolver(),
      });
      const result = await machine.pickR("en", "common");
      expect(result).toBe(commonR);
    });

    it("can be destructured and called without losing context", async () => {
      const machine = createMachine();
      const { pickR } = machine;
      const result = await pickR("en", "common");
      expect(result).toBe(commonR);
    });

    it("resolves multiple concurrent pickR calls for different locales", async () => {
      const machine = createMachine({
        rModuleResolver: createDelayedResolver(),
      });
      const [en, it] = await Promise.all([machine.pickR("en", "common"), machine.pickR("it", "common")]);
      expect(en).toBe(commonR);
      expect(it).toBe(itCommonR);
    });

    it("resolves multiple concurrent pickR calls for different namespaces", async () => {
      const machine = createMachine({
        rModuleResolver: createDelayedResolver(),
      });
      const [common, nav, footer] = await Promise.all([
        machine.pickR("en", "common"),
        machine.pickR("en", "nav"),
        machine.pickR("en", "footer"),
      ]);
      expect(common).toBe(commonR);
      expect(nav).toBe(navR);
      expect(footer).toBe(footerR);
    });
  });

  describe("pickRKit", () => {
    it("resolves a kit with a single namespace", async () => {
      const machine = createMachine();
      const kit = await machine.pickRKit("en", "common");
      expect(kit).toEqual([commonR]);
    });

    it("resolves a kit with multiple namespaces", async () => {
      const machine = createMachine();
      const kit = await machine.pickRKit("en", "common", "nav");
      expect(kit).toEqual([commonR, navR]);
    });

    it("resolves a kit with all namespaces", async () => {
      const machine = createMachine();
      const kit = await machine.pickRKit("en", "common", "nav", "footer");
      expect(kit).toEqual([commonR, navR, footerR]);
    });

    it("resolves a kit for a different locale", async () => {
      const machine = createMachine();
      const kit = await machine.pickRKit("it", "common", "nav");
      expect(kit).toEqual([itCommonR, itNavR]);
    });

    it("throws RMachineError for an invalid locale", () => {
      const machine = createMachine();
      expect(() => machine.pickRKit("fr", "common")).toThrow(RMachineError);
    });

    it("throws RMachineError with a descriptive message for an invalid locale", () => {
      const machine = createMachine();
      expect(() => machine.pickRKit("fr", "common")).toThrow(/Cannot use invalid locale: "fr"/);
    });

    it("returns a promise", () => {
      const machine = createMachine();
      const result = machine.pickRKit("en", "common");
      expect(result).toBeInstanceOf(Promise);
    });

    it("rejects when the resolver rejects for any namespace", async () => {
      const machine = createMachine();
      await expect(machine.pickRKit("en", "common", "nonexistent")).rejects.toThrow();
    });

    it("can be destructured and called without losing context", async () => {
      const machine = createMachine();
      const { pickRKit } = machine;
      const kit = await pickRKit("en", "common", "nav");
      expect(kit).toEqual([commonR, navR]);
    });

    it("works with a delayed resolver", async () => {
      const machine = createMachine({
        rModuleResolver: createDelayedResolver(),
      });
      const kit = await machine.pickRKit("en", "common", "nav");
      expect(kit).toEqual([commonR, navR]);
    });

    it("resolves concurrent pickRKit calls for different locales", async () => {
      const machine = createMachine({
        rModuleResolver: createDelayedResolver(),
      });
      const [enKit, itKit] = await Promise.all([
        machine.pickRKit("en", "common", "nav"),
        machine.pickRKit("it", "common", "nav"),
      ]);
      expect(enKit).toEqual([commonR, navR]);
      expect(itKit).toEqual([itCommonR, itNavR]);
    });
  });

  describe("pickR and pickRKit interaction", () => {
    it("can use pickR and pickRKit on the same locale without conflict", async () => {
      const machine = createMachine();
      const [common, kit] = await Promise.all([machine.pickR("en", "common"), machine.pickRKit("en", "nav", "footer")]);
      expect(common).toBe(commonR);
      expect(kit).toEqual([navR, footerR]);
    });

    it("shares cached resources between pickR and pickRKit", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, locale) => {
        const mod = allModules[locale]?.[namespace];
        if (!mod) {
          return Promise.reject(new Error(`No module for "${namespace}" in "${locale}"`));
        }
        return Promise.resolve(mod);
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
        if (!mod) {
          return Promise.reject(new Error(`No module for "${namespace}" in "${locale}"`));
        }
        return Promise.resolve(mod);
      });
      const machine = createMachine({ rModuleResolver: resolver });

      await machine.pickR("en", "common");
      await machine.pickR("it", "common");

      const commonCalls = resolver.mock.calls.filter(([ns]) => ns === "common");
      expect(commonCalls).toHaveLength(2);
    });
  });

  describe("locale validation across methods", () => {
    it("throws synchronously before the resolver is called for pickR", () => {
      const resolver = vi.fn<RModuleResolver>();
      const machine = createMachine({ rModuleResolver: resolver });

      expect(() => machine.pickR("fr", "common")).toThrow(RMachineError);
      expect(resolver).not.toHaveBeenCalled();
    });

    it("throws synchronously before the resolver is called for pickRKit", () => {
      const resolver = vi.fn<RModuleResolver>();
      const machine = createMachine({ rModuleResolver: resolver });

      expect(() => machine.pickRKit("fr", "common")).toThrow(RMachineError);
      expect(resolver).not.toHaveBeenCalled();
    });

    it("validates locale consistently across pickR and pickRKit", () => {
      const machine = createMachine();
      const invalidLocales = ["fr", "de", "ja", "", "EN"];

      for (const locale of invalidLocales) {
        expect(() => machine.pickR(locale, "common"), `pickR should reject "${locale}"`).toThrow(RMachineError);
        expect(() => machine.pickRKit(locale, "common"), `pickRKit should reject "${locale}"`).toThrow(RMachineError);
      }
    });

    it("accepts all configured locales", async () => {
      const machine = createMachine();

      const enResult = await machine.pickR("en", "common");
      const itResult = await machine.pickR("it", "common");

      expect(enResult).toBe(commonR);
      expect(itResult).toBe(itCommonR);
    });
  });

  describe("factory-based resources", () => {
    it("resolves resources from factory functions", async () => {
      const factoryR = { dynamic: true };
      const factory = () => factoryR;
      const resolver: RModuleResolver = () => Promise.resolve({ default: factory });

      const machine = createMachine({ rModuleResolver: resolver });
      const result = await machine.pickR("en", "common");
      expect(result).toBe(factoryR);
    });

    it("resolves resources from async factory functions", async () => {
      const asyncR = { async: true };
      const factory = () => Promise.resolve(asyncR);
      const resolver: RModuleResolver = () => Promise.resolve({ default: factory });

      const machine = createMachine({ rModuleResolver: resolver });
      const result = await machine.pickR("en", "common");
      expect(result).toBe(asyncR);
    });
  });

  describe("multiple instances", () => {
    it("creates independent instances that do not share state", async () => {
      const machine1 = createMachine();
      const machine2 = createMachine({
        locales: ["en", "it"],
        defaultLocale: "it",
      });

      expect(machine1.config.defaultLocale).toBe("en");
      expect(machine2.config.defaultLocale).toBe("it");

      const r1 = await machine1.pickR("en", "common");
      const r2 = await machine2.pickR("en", "common");
      expect(r1).toBe(commonR);
      expect(r2).toBe(commonR);
    });

    it("resolver calls are independent between instances", async () => {
      const resolver1 = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const resolver2 = vi.fn<RModuleResolver>(() => Promise.resolve({ default: itCommonR }));

      const machine1 = createMachine({ rModuleResolver: resolver1 });
      const machine2 = createMachine({ rModuleResolver: resolver2 });

      await machine1.pickR("en", "common");
      await machine2.pickR("en", "common");

      expect(resolver1).toHaveBeenCalledTimes(1);
      expect(resolver2).toHaveBeenCalledTimes(1);
    });
  });

  describe("hybridPickR (via subclass)", () => {
    class TestableRMachine extends RMachine<Record<string, Record<string, unknown>>> {
      public testHybridPickR(locale: string, namespace: string) {
        return this.hybridPickR(locale, namespace);
      }
      public testHybridPickRKit(locale: string, ...namespaces: string[]) {
        return this.hybridPickRKit(locale, ...namespaces);
      }
    }

    function createTestableMachine(overrides: Partial<RMachineConfig> = {}) {
      return new TestableRMachine(makeConfig(overrides));
    }

    it("returns a promise when resource is not yet loaded", () => {
      const machine = createTestableMachine();
      const result = machine.testHybridPickR("en", "common");
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns the resource directly when already cached", async () => {
      const machine = createTestableMachine();
      await machine.pickR("en", "common");
      const result = machine.testHybridPickR("en", "common");
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toBe(commonR);
    });

    it("returns the same promise when resource is still loading", async () => {
      const machine = createTestableMachine({
        rModuleResolver: createDelayedResolver(allModules, 50),
      });
      const promise1 = machine.testHybridPickR("en", "common");
      const promise2 = machine.testHybridPickR("en", "common");
      expect(promise1).toBe(promise2);
      await Promise.all([promise1, promise2]);
    });

    it("throws RMachineError for an invalid locale", () => {
      const machine = createTestableMachine();
      expect(() => machine.testHybridPickR("fr", "common")).toThrow(RMachineError);
    });
  });

  describe("hybridPickRKit (via subclass)", () => {
    class TestableRMachine extends RMachine<Record<string, Record<string, unknown>>> {
      public testHybridPickRKit(locale: string, ...namespaces: string[]) {
        return this.hybridPickRKit(locale, ...namespaces);
      }
    }

    function createTestableMachine(overrides: Partial<RMachineConfig> = {}) {
      return new TestableRMachine(makeConfig(overrides));
    }

    it("returns a promise when resources are not yet loaded", () => {
      const machine = createTestableMachine();
      const result = machine.testHybridPickRKit("en", "common", "nav");
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns the kit directly when all resources are cached", async () => {
      const machine = createTestableMachine();
      await machine.pickRKit("en", "common", "nav");
      const result = machine.testHybridPickRKit("en", "common", "nav");
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toEqual([commonR, navR]);
    });

    it("returns a promise when some resources are cached but not all", async () => {
      const machine = createTestableMachine();
      await machine.pickR("en", "common");
      const result = machine.testHybridPickRKit("en", "common", "nav");
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns empty array for empty namespaces", () => {
      const machine = createTestableMachine();
      const result = machine.testHybridPickRKit("en");
      expect(result).toEqual([]);
    });

    it("throws RMachineError for an invalid locale", () => {
      const machine = createTestableMachine();
      expect(() => machine.testHybridPickRKit("fr", "common")).toThrow(RMachineError);
    });
  });

  describe("pickRKit edge cases", () => {
    it("returns empty array when called with no namespaces", async () => {
      const machine = createMachine();
      const kit = await machine.pickRKit("en");
      expect(kit).toEqual([]);
    });

    it("handles single namespace", async () => {
      const machine = createMachine();
      const kit = await machine.pickRKit("en", "common");
      expect(kit).toEqual([commonR]);
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
        if (callCount === 1) {
          return Promise.reject(new Error("First call fails"));
        }
        return Promise.resolve({ default: commonR });
      };
      const machine = createMachine({ rModuleResolver: resolver });

      await expect(machine.pickR("en", "common")).rejects.toThrow(RMachineError);
      const result = await machine.pickR("en", "common");
      expect(result).toBe(commonR);
      expect(callCount).toBe(2);
    });

    it("handles factory function throwing synchronously", async () => {
      const factory = () => {
        throw new Error("Factory error");
      };
      const resolver: RModuleResolver = () => Promise.resolve({ default: factory });
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickR("en", "common")).rejects.toThrow("Factory error");
    });

    it("handles async factory function rejecting", async () => {
      const factory = () => Promise.reject(new Error("Async factory error"));
      const resolver: RModuleResolver = () => Promise.resolve({ default: factory });
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickR("en", "common")).rejects.toThrow(RMachineError);
      await expect(machine.pickR("en", "common")).rejects.toThrow(/factory promise rejected/);
    });

    it("propagates rejection for pickRKit when one namespace fails", async () => {
      const resolver: RModuleResolver = (namespace) => {
        if (namespace === "fail") {
          return Promise.reject(new Error("Namespace fail error"));
        }
        return Promise.resolve({ default: commonR });
      };
      const machine = createMachine({ rModuleResolver: resolver });
      await expect(machine.pickRKit("en", "common", "fail")).rejects.toThrow(RMachineError);
    });
  });

  describe("concurrent call deduplication", () => {
    it("deduplicates concurrent pickR calls to the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ default: commonR }), 20);
        });
      });
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
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const mod = enModules[namespace];
            if (mod) resolve(mod);
          }, 20);
        });
      });
      const machine = createMachine({ rModuleResolver: resolver });

      await Promise.all([machine.pickR("en", "common"), machine.pickR("en", "nav")]);

      expect(resolver).toHaveBeenCalledTimes(2);
    });

    it("deduplicates concurrent pickRKit calls for the same namespaces", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const mod = enModules[namespace];
            if (mod) resolve(mod);
          }, 20);
        });
      });
      const machine = createMachine({ rModuleResolver: resolver });

      const [kit1, kit2] = await Promise.all([
        machine.pickRKit("en", "common", "nav"),
        machine.pickRKit("en", "common", "nav"),
      ]);

      expect(kit1).toEqual([commonR, navR]);
      expect(kit2).toEqual([commonR, navR]);
      expect(resolver).toHaveBeenCalledTimes(2);
    });
  });

  describe("namespace edge cases", () => {
    it("handles namespaces with special characters", async () => {
      const specialR = { special: true };
      const specialModules: Record<string, Record<string, AnyRModule>> = {
        en: { "my-namespace": { default: specialR } },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(specialModules),
      });
      const result = await machine.pickR("en", "my-namespace");
      expect(result).toBe(specialR);
    });

    it("handles namespaces with dots", async () => {
      const dottedR = { dotted: true };
      const dottedModules: Record<string, Record<string, AnyRModule>> = {
        en: { "my.namespace.here": { default: dottedR } },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(dottedModules),
      });
      const result = await machine.pickR("en", "my.namespace.here");
      expect(result).toBe(dottedR);
    });

    it("handles namespaces with slashes", async () => {
      const slashedR = { slashed: true };
      const slashedModules: Record<string, Record<string, AnyRModule>> = {
        en: { "path/to/namespace": { default: slashedR } },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(slashedModules),
      });
      const result = await machine.pickR("en", "path/to/namespace");
      expect(result).toBe(slashedR);
    });

    it("treats namespace strings as case-sensitive", async () => {
      const lowerR = { lower: true };
      const upperR = { upper: true };
      const caseModules: Record<string, Record<string, AnyRModule>> = {
        en: {
          common: { default: lowerR },
          Common: { default: upperR },
        },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(caseModules),
      });

      const lower = await machine.pickR("en", "common");
      const upper = await machine.pickR("en", "Common");

      expect(lower).toBe(lowerR);
      expect(upper).toBe(upperR);
    });
  });

  describe("resource types", () => {
    it("handles resources with nested objects", async () => {
      const nestedR = {
        level1: {
          level2: {
            value: "deep",
          },
        },
      };
      const nestedModules: Record<string, Record<string, AnyRModule>> = {
        en: { nested: { default: nestedR } },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(nestedModules),
      });
      const result = await machine.pickR("en", "nested");
      expect(result).toBe(nestedR);
      expect((result as typeof nestedR).level1.level2.value).toBe("deep");
    });

    it("handles resources with arrays", async () => {
      const arrayR = {
        items: ["one", "two", "three"],
      };
      const arrayModules: Record<string, Record<string, AnyRModule>> = {
        en: { array: { default: arrayR } },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(arrayModules),
      });
      const result = await machine.pickR("en", "array");
      expect(result).toBe(arrayR);
      expect((result as typeof arrayR).items).toHaveLength(3);
    });

    it("handles resources with functions", async () => {
      const funcR = {
        greet: (name: string) => `Hello, ${name}!`,
      };
      const funcModules: Record<string, Record<string, AnyRModule>> = {
        en: { func: { default: funcR } },
      };
      const machine = createMachine({
        rModuleResolver: createMockResolver(funcModules),
      });
      const result = await machine.pickR("en", "func");
      expect((result as typeof funcR).greet("World")).toBe("Hello, World!");
    });
  });
});

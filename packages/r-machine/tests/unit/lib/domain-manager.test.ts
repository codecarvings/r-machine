import { describe, expect, it, vi } from "vitest";

import { Domain } from "../../../src/lib/domain.js";
import { DomainManager } from "../../../src/lib/domain-manager.js";
import type { AnyRModule, RModuleResolver } from "../../../src/lib/r-module.js";

const commonR = { greeting: "hello" };
const navR = { home: "Home" };

const modules: Record<string, Record<string, AnyRModule>> = {
  en: {
    common: { default: commonR },
    nav: { default: navR },
  },
  it: {
    common: { default: { greeting: "ciao" } },
  },
};

function createMockResolver(mods: Record<string, Record<string, AnyRModule>>): RModuleResolver {
  return (namespace, locale) => {
    const localeModules = mods[locale];
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

describe("DomainManager", () => {
  describe("constructor", () => {
    it("accepts an RModuleResolver", () => {
      const resolver = createMockResolver(modules);
      const manager = new DomainManager(resolver);
      expect(manager).toBeInstanceOf(DomainManager);
    });
  });

  describe("getDomain", () => {
    it("returns a Domain instance", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      expect(domain).toBeInstanceOf(Domain);
    });

    it("returns a Domain with the correct locale", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      expect(domain.locale).toBe("en");
    });

    it("returns a Domain with a different locale", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("it");
      expect(domain.locale).toBe("it");
    });

    it("returns the same Domain instance for the same locale", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain1 = manager.getDomain("en");
      const domain2 = manager.getDomain("en");
      expect(domain1).toBe(domain2);
    });

    it("returns different Domain instances for different locales", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const en = manager.getDomain("en");
      const it = manager.getDomain("it");
      expect(en).not.toBe(it);
    });

    it("caches domains across multiple calls", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const first = manager.getDomain("en");
      manager.getDomain("it");
      const second = manager.getDomain("en");
      expect(first).toBe(second);
    });

    it("creates domains that can resolve resources", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      const result = await domain.pickR("common");
      expect(result).toBe(commonR);
    });

    it("creates domains that share the same resolver", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, locale) => {
        const mod = modules[locale]?.[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });

      const manager = new DomainManager(resolver);

      const en = manager.getDomain("en");
      const it = manager.getDomain("it");

      await en.pickR("common");
      await it.pickR("common");

      expect(resolver).toHaveBeenCalledTimes(2);
      expect(resolver).toHaveBeenCalledWith("common", "en");
      expect(resolver).toHaveBeenCalledWith("common", "it");
    });

    it("domains for different locales resolve locale-specific resources", async () => {
      const manager = new DomainManager(createMockResolver(modules));

      const en = manager.getDomain("en");
      const it = manager.getDomain("it");

      const enR = await en.pickR("common");
      const itR = await it.pickR("common");

      expect(enR).toEqual({ greeting: "hello" });
      expect(itR).toEqual({ greeting: "ciao" });
    });

    it("handles locale strings with special characters", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("zh-Hant-TW");
      expect(domain).toBeInstanceOf(Domain);
      expect(domain.locale).toBe("zh-Hant-TW");
    });

    it("treats locale strings as case-sensitive", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const lower = manager.getDomain("en");
      const upper = manager.getDomain("EN");
      expect(lower).not.toBe(upper);
    });
  });

  describe("caching behavior", () => {
    it("cached domain retains its resolved resources", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");

      await domain.pickR("common");

      const sameDomain = manager.getDomain("en");
      const r = sameDomain.hybridPickR("common");
      expect(r).not.toBeInstanceOf(Promise);
      expect(r).toBe(commonR);
    });

    it("each DomainManager has independent caches", () => {
      const resolver = createMockResolver(modules);
      const manager1 = new DomainManager(resolver);
      const manager2 = new DomainManager(resolver);

      const domain1 = manager1.getDomain("en");
      const domain2 = manager2.getDomain("en");

      expect(domain1).not.toBe(domain2);
    });

    it("caches many locales independently", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const locales = ["en", "it", "de", "es", "fr", "pt", "ja", "ko", "zh"];
      const domains = locales.map((l) => manager.getDomain(l));

      for (let i = 0; i < locales.length; i++) {
        expect(domains[i].locale).toBe(locales[i]);
        expect(manager.getDomain(locales[i])).toBe(domains[i]);
      }
    });

    it("domain resolver failure does not evict from manager cache", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");

      await expect(domain.pickR("nonexistent")).rejects.toThrow();

      const sameDomain = manager.getDomain("en");
      expect(sameDomain).toBe(domain);
    });
  });
});

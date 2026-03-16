import { describe, expect, it, vi } from "vitest";

import { Domain } from "../../src/lib/domain.js";
import { DomainManager } from "../../src/lib/domain-manager.js";
import type { AnyRModule, RModuleResolver } from "../../src/lib/r-module.js";
import { createMockResolver } from "../_fixtures/resolver-helpers.js";

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

describe("DomainManager", () => {
  describe("getDomain", () => {
    it("returns a Domain with the correct locale", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      expect(domain).toBeInstanceOf(Domain);
      expect(domain.locale).toBe("en");
    });

    it("caches and returns the same Domain for the same locale", () => {
      const manager = new DomainManager(createMockResolver(modules));
      const first = manager.getDomain("en");
      const second = manager.getDomain("en");
      expect(first).toBe(second);
    });

    it("returns different Domain instances for different locales", () => {
      const manager = new DomainManager(createMockResolver(modules));
      expect(manager.getDomain("en")).not.toBe(manager.getDomain("it"));
    });

    it("creates domains that share the same resolver", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, locale) => {
        const mod = modules[locale]?.[namespace];
        return mod ? Promise.resolve(mod) : Promise.reject(new Error("not found"));
      });
      const manager = new DomainManager(resolver);

      await manager.getDomain("en").pickR("common");
      await manager.getDomain("it").pickR("common");

      expect(resolver).toHaveBeenCalledTimes(2);
      expect(resolver).toHaveBeenCalledWith("common", "en");
      expect(resolver).toHaveBeenCalledWith("common", "it");
    });

    it("domains resolve locale-specific resources", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      expect(await manager.getDomain("en").pickR("common")).toEqual({ greeting: "hello" });
      expect(await manager.getDomain("it").pickR("common")).toEqual({ greeting: "ciao" });
    });
  });

  describe("caching behavior", () => {
    it("cached domain retains its resolved resources", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      await domain.pickR("common");

      const sameDomain = manager.getDomain("en");
      expect(sameDomain.hybridPickR("common")).toBe(commonR);
    });

    it("each DomainManager has independent caches", () => {
      const resolver = createMockResolver(modules);
      const manager1 = new DomainManager(resolver);
      const manager2 = new DomainManager(resolver);
      expect(manager1.getDomain("en")).not.toBe(manager2.getDomain("en"));
    });

    it("domain resolver failure does not evict from manager cache", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      await expect(domain.pickR("nonexistent")).rejects.toThrow();
      expect(manager.getDomain("en")).toBe(domain);
    });

    it("failed namespace does not prevent resolving other namespaces in the same domain", async () => {
      const manager = new DomainManager(createMockResolver(modules));
      const domain = manager.getDomain("en");
      await expect(domain.pickR("nonexistent")).rejects.toThrow();
      expect(await domain.pickR("common")).toEqual(commonR);
    });
  });
});

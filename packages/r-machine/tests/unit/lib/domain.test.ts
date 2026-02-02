import { describe, expect, it, vi } from "vitest";

import { Domain } from "../../../src/lib/domain.js";
import type { AnyRModule, RModuleResolver } from "../../../src/lib/r-module.js";

function createMockResolver(modules: Record<string, Record<string, AnyRModule>>): RModuleResolver {
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

function createDelayedResolver(modules: Record<string, Record<string, AnyRModule>>, delayMs = 10): RModuleResolver {
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

const commonR = { greeting: "hello" };
const navR = { home: "Home", about: "About" };
const footerR = { copyright: "2024" };

const modules: Record<string, Record<string, AnyRModule>> = {
  en: {
    common: { default: commonR },
    nav: { default: navR },
    footer: { default: footerR },
  },
};

describe("Domain", () => {
  describe("constructor", () => {
    it("stores the locale", () => {
      const domain = new Domain("en", createMockResolver(modules));
      expect(domain.locale).toBe("en");
    });

    it("stores a different locale", () => {
      const domain = new Domain("it", createMockResolver(modules));
      expect(domain.locale).toBe("it");
    });
  });

  describe("hybridPickR", () => {
    it("returns a promise on first call for an unresolved namespace", () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = domain.hybridPickR("common");
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves to the correct resource", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.hybridPickR("common");
      expect(result).toBe(commonR);
    });

    it("returns the resolved resource synchronously on subsequent calls", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await domain.hybridPickR("common");

      const result = domain.hybridPickR("common");
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toBe(commonR);
    });

    it("returns the pending promise if called again before resolution", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));
      const first = domain.hybridPickR("common");
      const second = domain.hybridPickR("common");
      expect(first).toBeInstanceOf(Promise);
      expect(second).toBe(first);
    });

    it("resolves different namespaces independently", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const [r1, r2] = await Promise.all([domain.hybridPickR("common"), domain.hybridPickR("nav")]);
      expect(r1).toBe(commonR);
      expect(r2).toBe(navR);
    });

    it("rejects when the resolver fails", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await expect(domain.hybridPickR("nonexistent")).rejects.toThrow();
    });

    it("allows retrying after a failed resolution", async () => {
      let callCount = 0;
      const resolver: RModuleResolver = (_namespace, _locale) => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("transient failure"));
        }
        return Promise.resolve({ default: commonR });
      };

      const domain = new Domain("en", resolver);

      await expect(domain.hybridPickR("common")).rejects.toThrow();

      const result = await domain.hybridPickR("common");
      expect(result).toBe(commonR);
    });

    it("handles factory-based modules", async () => {
      const factoryR = { dynamic: true };
      const factory = () => factoryR;
      const resolver = createMockResolver({
        en: { dynamic: { default: factory } },
      });
      const domain = new Domain("en", resolver);
      const result = await domain.hybridPickR("dynamic");
      expect(result).toBe(factoryR);
    });

    it("handles async factory-based modules", async () => {
      const asyncR = { async: true };
      const factory = () => Promise.resolve(asyncR);
      const resolver = createMockResolver({
        en: { async: { default: factory } },
      });
      const domain = new Domain("en", resolver);
      const result = await domain.hybridPickR("async");
      expect(result).toBe(asyncR);
    });
  });

  describe("pickR", () => {
    it("always returns a promise", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result1 = domain.pickR("common");
      expect(result1).toBeInstanceOf(Promise);
      const r1 = await result1;
      const result2 = domain.pickR("common");
      expect(result2).toBeInstanceOf(Promise);
      const r2 = await result2;
      expect(r1).toBe(r2);
    });

    it("resolves to the correct resource", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.pickR("common");
      expect(result).toBe(commonR);
    });

    it("returns a resolved promise for cached resources", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await domain.pickR("common");

      const result = domain.pickR("common");
      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(resolved).toBe(commonR);
    });

    it("returns the same pending promise for in-flight requests", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));
      const first = domain.pickR("common");
      const second = domain.pickR("common");

      expect(first).toBeInstanceOf(Promise);
      expect(second).toBe(first);
    });

    it("resolves different namespaces independently", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const [r1, r2] = await Promise.all([domain.pickR("common"), domain.pickR("nav")]);
      expect(r1).toBe(commonR);
      expect(r2).toBe(navR);
    });

    it("rejects when the resolver fails", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await expect(domain.pickR("nonexistent")).rejects.toThrow();
    });

    it("calls the resolver only once for the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const domain = new Domain("en", resolver);

      await domain.pickR("common");
      await domain.pickR("common");

      expect(resolver).toHaveBeenCalledTimes(1);
    });
  });

  describe("hybridPickRKit", () => {
    it("returns an empty array synchronously for empty namespace list", () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = domain.hybridPickRKit([]);
      expect(result).toEqual([]);
      expect(result).not.toBeInstanceOf(Promise);
    });

    it("returns a promise when resources are not yet resolved", () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves to the correct resource kit", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.hybridPickRKit(["common", "nav"]);
      expect(result).toEqual([commonR, navR]);
    });

    it("returns resources synchronously when all are cached", async () => {
      const domain = new Domain("en", createMockResolver(modules));

      await domain.hybridPickRKit(["common", "nav"]);

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toEqual([commonR, navR]);
    });

    it("returns a promise when some resources are cached and some are not", async () => {
      const domain = new Domain("en", createMockResolver(modules));

      await domain.pickR("common");

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(resolved).toEqual([commonR, navR]);
    });

    it("returns a promise when some resources are still pending", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));

      domain.pickR("common");

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves a single namespace kit", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.hybridPickRKit(["common"]);
      expect(result).toEqual([commonR]);
    });

    it("resolves three namespaces", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.hybridPickRKit(["common", "nav", "footer"]);
      expect(result).toEqual([commonR, navR, footerR]);
    });

    it("rejects if any namespace fails to resolve", async () => {
      const failR = { fail: true };
      const resolver: RModuleResolver = (namespace) => {
        if (namespace === "missing") {
          return Promise.reject(new Error("not found"));
        }
        return Promise.resolve({ default: failR });
      };
      const domain = new Domain("en", resolver);
      await expect(domain.hybridPickRKit(["common", "missing"])).rejects.toThrow();
    });

    it("deduplicates concurrent requests for the same kit", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));
      const first = domain.hybridPickRKit(["common", "nav"]);
      const second = domain.hybridPickRKit(["common", "nav"]);
      expect(first).toBe(second);
    });

    it("does not deduplicate kits with different namespace order", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));
      const first = domain.hybridPickRKit(["common", "nav"]);
      const second = domain.hybridPickRKit(["nav", "common"]);
      expect(first).not.toBe(second);
    });
  });

  describe("pickRKit", () => {
    it("returns a resolved promise for empty namespace list", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = domain.pickRKit([]);
      expect(result).toBeInstanceOf(Promise);
      expect(await result).toEqual([]);
    });

    it("returns a promise for unresolved namespaces", () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = domain.pickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves to the correct resource kit", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.pickRKit(["common", "nav"]);
      expect(result).toEqual([commonR, navR]);
    });

    it("returns a resolved promise when all resources are cached", async () => {
      const domain = new Domain("en", createMockResolver(modules));

      await domain.pickRKit(["common", "nav"]);

      const result = domain.pickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
      expect(await result).toEqual([commonR, navR]);
    });

    it("resolves a single namespace kit", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.pickRKit(["common"]);
      expect(result).toEqual([commonR]);
    });

    it("resolves three namespaces", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      const result = await domain.pickRKit(["common", "nav", "footer"]);
      expect(result).toEqual([commonR, navR, footerR]);
    });

    it("rejects if any namespace fails to resolve", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await expect(domain.pickRKit(["common", "nonexistent"])).rejects.toThrow();
    });

    it("calls the resolver only once per namespace across multiple kit requests", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, _locale) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver);

      await domain.pickRKit(["common", "nav"]);
      await domain.pickRKit(["common", "nav"]);

      expect(resolver).toHaveBeenCalledTimes(2);
    });

    it("deduplicates concurrent requests for the same kit", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));
      const first = domain.pickRKit(["common", "nav"]);
      const second = domain.pickRKit(["common", "nav"]);
      expect(first).toBe(second);
    });

    it("does not deduplicate kits with different namespace order", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50));
      const first = domain.pickRKit(["common", "nav"]);
      const second = domain.pickRKit(["nav", "common"]);
      expect(first).not.toBe(second);
    });
  });

  describe("cross-method caching", () => {
    it("pickR resolves cache used by hybridPickR", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await domain.pickR("common");

      const result = domain.hybridPickR("common");
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toBe(commonR);
    });

    it("hybridPickR resolves cache used by pickR", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await domain.hybridPickR("common");

      const result = await domain.pickR("common");
      expect(result).toBe(commonR);
    });

    it("pickR resolves cache used by hybridPickRKit", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await domain.pickR("common");
      await domain.pickR("nav");

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toEqual([commonR, navR]);
    });

    it("pickRKit resolves cache used by hybridPickR", async () => {
      const domain = new Domain("en", createMockResolver(modules));
      await domain.pickRKit(["common", "nav"]);

      const r = domain.hybridPickR("common");
      expect(r).not.toBeInstanceOf(Promise);
      expect(r).toBe(commonR);
    });

    it("hybridPickRKit resolves cache used by pickR", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, _locale) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver);
      await domain.hybridPickRKit(["common", "nav"]);

      resolver.mockClear();
      await domain.pickR("common");

      expect(resolver).not.toHaveBeenCalled();
    });
  });

  describe("concurrent resolution behavior", () => {
    it("deduplicates concurrent pickR calls for the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const domain = new Domain("en", resolver);

      const [r1, r2] = await Promise.all([domain.pickR("common"), domain.pickR("common")]);

      expect(r1).toBe(commonR);
      expect(r2).toBe(commonR);
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    it("deduplicates concurrent hybridPickR calls for the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const domain = new Domain("en", resolver);

      const [r1, r2] = await Promise.all([
        Promise.resolve(domain.hybridPickR("common")),
        Promise.resolve(domain.hybridPickR("common")),
      ]);

      expect(r1).toBe(commonR);
      expect(r2).toBe(commonR);
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    it("resolves multiple kits sharing namespaces without extra resolver calls", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, _locale) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver);

      const [kit1, kit2] = await Promise.all([
        domain.pickRKit(["common", "nav"]),
        domain.pickRKit(["common", "footer"]),
      ]);

      expect(kit1).toEqual([commonR, navR]);
      expect(kit2).toEqual([commonR, footerR]);
      expect(resolver).toHaveBeenCalledTimes(3);
    });

    it("pending RKit promise is cleaned up after resolution", async () => {
      const domain = new Domain("en", createMockResolver(modules));

      const kit1 = domain.pickRKit(["common", "nav"]);
      const kit1Duplicate = domain.pickRKit(["common", "nav"]);
      expect(kit1).toBe(kit1Duplicate);

      await kit1;

      const kit2 = domain.pickRKit(["common", "nav"]);
      expect(kit2).not.toBe(kit1);
    });

    it("pending RKit promise is cleaned up after rejection", async () => {
      const domain = new Domain("en", createMockResolver(modules));

      const kit1 = domain.pickRKit(["common", "nonexistent"]);
      await expect(kit1).rejects.toThrow();

      const kit2 = domain.pickRKit(["common", "nonexistent"]);
      expect(kit2).not.toBe(kit1);
      await expect(kit2).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("rejects with an error when the module resolver rejects", async () => {
      const resolver: RModuleResolver = () => Promise.reject(new Error("network error"));
      const domain = new Domain("en", resolver);

      await expect(domain.pickR("common")).rejects.toThrow();
    });

    it("clears the cache entry on resolver failure", async () => {
      let shouldFail = true;
      const resolver: RModuleResolver = () => {
        if (shouldFail) {
          return Promise.reject(new Error("fail"));
        }
        return Promise.resolve({ default: commonR });
      };
      const domain = new Domain("en", resolver);

      await expect(domain.pickR("common")).rejects.toThrow();

      shouldFail = false;
      const result = await domain.pickR("common");
      expect(result).toBe(commonR);
    });

    it("one namespace failure in a kit rejects the entire kit", async () => {
      const failingModules: Record<string, Record<string, AnyRModule>> = {
        en: {
          common: { default: commonR },
        },
      };
      const domain = new Domain("en", createMockResolver(failingModules));

      await expect(domain.pickRKit(["common", "nav"])).rejects.toThrow();
    });

    it("successful namespaces in a failed kit remain cached", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace, _locale) => {
        if (namespace === "fail") {
          return Promise.reject(new Error("fail"));
        }
        return Promise.resolve({ default: commonR });
      });
      const domain = new Domain("en", resolver);

      await expect(domain.pickRKit(["common", "fail"])).rejects.toThrow();

      const r = domain.hybridPickR("common");
      expect(r).not.toBeInstanceOf(Promise);
      expect(r).toBe(commonR);
    });

    it("rejects hybridPickRKit when a previously pending resource fails", async () => {
      let rejectFn: (reason: Error) => void;
      const resolver: RModuleResolver = (namespace) => {
        if (namespace === "slow-fail") {
          return new Promise((_resolve, reject) => {
            rejectFn = reject;
          });
        }
        return Promise.resolve({ default: commonR });
      };

      const domain = new Domain("en", resolver);

      domain.pickR("slow-fail");

      const kitPromise = domain.hybridPickRKit(["common", "slow-fail"]);
      expect(kitPromise).toBeInstanceOf(Promise);

      rejectFn!(new Error("delayed failure"));

      await expect(kitPromise).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("handles namespaces with special characters", async () => {
      const specialR = { special: true };
      const resolver = createMockResolver({
        en: { "ns/with/slashes": { default: specialR } },
      });
      const domain = new Domain("en", resolver);
      const result = await domain.pickR("ns/with/slashes");
      expect(result).toBe(specialR);
    });

    it("handles the kit key separator character in namespace names", async () => {
      const r1 = { id: 1 };
      const r2 = { id: 2 };
      const resolver = createMockResolver({
        en: {
          "a⨆b": { default: r1 },
          a: { default: r2 },
          b: { default: { id: 3 } },
        },
      });
      const domain = new Domain("en", resolver);

      const kitSingle = await domain.pickRKit(["a⨆b"]);
      expect(kitSingle).toEqual([r1]);

      const domain2 = new Domain("en", resolver);
      const kitMulti = await domain2.pickRKit(["a", "b"]);
      expect(kitMulti).toEqual([r2, { id: 3 }]);
    });

    it("each Domain instance has its own independent cache", async () => {
      const resolver = createMockResolver(modules);
      const domain1 = new Domain("en", resolver);
      const domain2 = new Domain("en", resolver);

      await domain1.pickR("common");

      const result = domain2.hybridPickR("common");
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolveRKit handles mix of cached, pending, and unresolved resources", async () => {
      let resolveSlow: (value: AnyRModule) => void;
      const resolver: RModuleResolver = (namespace) => {
        if (namespace === "slow") {
          return new Promise((resolve) => {
            resolveSlow = resolve;
          });
        }
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      };

      const domain = new Domain("en", resolver);

      await domain.pickR("common");
      domain.pickR("slow");

      const kitPromise = domain.pickRKit(["common", "slow", "nav"]);
      expect(kitPromise).toBeInstanceOf(Promise);

      const slowR = { slow: true };
      resolveSlow!({ default: slowR });

      const kit = await kitPromise;
      expect(kit[0]).toBe(commonR);
      expect(kit[1]).toBe(slowR);
      expect(kit[2]).toBe(navR);
    });
  });
});

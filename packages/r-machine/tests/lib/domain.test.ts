import { describe, expect, it, vi } from "vitest";

import { Domain } from "../../src/lib/domain.js";
import type { AnyFmtGetter } from "../../src/lib/fmt.js";
import type { AnyRModule, RModuleResolver } from "../../src/lib/r-module.js";
import { createDelayedResolver, createMockResolver } from "../_fixtures/resolver-helpers.js";

const noFmt: AnyFmtGetter = () => ({});

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
  it("stores the locale", () => {
    const domain = new Domain("en", createMockResolver(modules), noFmt);
    expect(domain.locale).toBe("en");
  });

  describe("formatter integration", () => {
    it("passes formatters to resource factories via $.fmt", async () => {
      const fmtGetter: AnyFmtGetter = (locale) => ({ lang: locale });
      const factory = vi.fn(($: { namespace: string; locale: string; fmt: any }) => ({
        greeting: `Hello in ${$.fmt.lang}`,
      }));
      const resolver: RModuleResolver = () => Promise.resolve({ default: factory });
      const domain = new Domain("en", resolver, fmtGetter);

      const result = await domain.pickR("common");
      expect(result).toEqual({ greeting: "Hello in en" });
      expect(factory).toHaveBeenCalledWith(expect.objectContaining({ fmt: { lang: "en" } }));
    });

    it("passes empty fmt when formatter getter returns empty object", async () => {
      const factory = vi.fn(() => ({ value: 1 }));
      const resolver: RModuleResolver = () => Promise.resolve({ default: factory });
      const domain = new Domain("en", resolver, noFmt);

      await domain.pickR("common");
      expect(factory).toHaveBeenCalledWith(expect.objectContaining({ fmt: {} }));
    });
  });

  const singleMethods = [
    { name: "pickR", pick: (d: Domain, ns: string) => d.pickR(ns) },
    { name: "hybridPickR", pick: (d: Domain, ns: string) => Promise.resolve(d.hybridPickR(ns)) },
  ] as const;

  describe.each(singleMethods)("$name — shared behavior", ({ pick }) => {
    it("resolves to the correct resource", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      expect(await pick(domain, "common")).toBe(commonR);
    });

    it("deduplicates in-flight requests for the same namespace", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50), noFmt);
      const first = pick(domain, "common");
      const second = pick(domain, "common");
      expect(second).toBe(first);
    });

    it("resolves different namespaces independently", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      const [r1, r2] = await Promise.all([pick(domain, "common"), pick(domain, "nav")]);
      expect(r1).toBe(commonR);
      expect(r2).toBe(navR);
    });

    it("rejects when the resolver fails", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await expect(pick(domain, "nonexistent")).rejects.toThrow();
    });
  });

  describe("hybridPickR", () => {
    it("returns a promise on first call, then the value synchronously", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      const first = domain.hybridPickR("common");
      expect(first).toBeInstanceOf(Promise);
      await first;

      const second = domain.hybridPickR("common");
      expect(second).not.toBeInstanceOf(Promise);
      expect(second).toBe(commonR);
    });

    it("allows retrying after a failed resolution", async () => {
      let callCount = 0;
      const resolver: RModuleResolver = () => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("transient failure"));
        }
        return Promise.resolve({ default: commonR });
      };

      const domain = new Domain("en", resolver, noFmt);
      await expect(domain.hybridPickR("common")).rejects.toThrow();

      const result = await domain.hybridPickR("common");
      expect(result).toBe(commonR);
    });
  });

  describe("pickR", () => {
    it("always returns a promise, even when cached", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      const result1 = domain.pickR("common");
      expect(result1).toBeInstanceOf(Promise);
      const r1 = await result1;
      const result2 = domain.pickR("common");
      expect(result2).toBeInstanceOf(Promise);
      expect(await result2).toBe(r1);
    });

    it("calls the resolver only once for the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const domain = new Domain("en", resolver, noFmt);

      await domain.pickR("common");
      await domain.pickR("common");

      expect(resolver).toHaveBeenCalledTimes(1);
    });
  });

  const kitMethods = [
    { name: "pickRKit", pick: (d: Domain, ns: string[]) => d.pickRKit(ns) },
    { name: "hybridPickRKit", pick: (d: Domain, ns: string[]) => Promise.resolve(d.hybridPickRKit(ns)) },
  ] as const;

  describe.each(kitMethods)("$name — shared behavior", ({ pick }) => {
    it("resolves to the correct resource kit", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      expect(await pick(domain, ["common", "nav"])).toEqual([commonR, navR]);
    });

    it("rejects if any namespace fails to resolve", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await expect(pick(domain, ["common", "nonexistent"])).rejects.toThrow();
    });

    it("deduplicates concurrent requests for the same kit", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50), noFmt);
      const first = pick(domain, ["common", "nav"]);
      const second = pick(domain, ["common", "nav"]);
      expect(first).toBe(second);
    });

    it("does not deduplicate kits with different namespace order", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50), noFmt);
      const first = pick(domain, ["common", "nav"]);
      const second = pick(domain, ["nav", "common"]);
      expect(first).not.toBe(second);
    });
  });

  describe("hybridPickRKit", () => {
    it("returns an empty array synchronously for empty namespace list", () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      const result = domain.hybridPickRKit([]);
      expect(result).toEqual([]);
      expect(result).not.toBeInstanceOf(Promise);
    });

    it("returns an empty array synchronously even when cache is populated", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.pickR("common");

      const result = domain.hybridPickRKit([]);
      expect(result).toEqual([]);
      expect(result).not.toBeInstanceOf(Promise);
    });

    it("returns a promise when resources are not yet resolved", () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns resources synchronously when all are cached", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.hybridPickRKit(["common", "nav"]);

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toEqual([commonR, navR]);
    });

    it("returns a promise when some resources are cached and some are not", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.pickR("common");

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
      expect(await result).toEqual([commonR, navR]);
    });

    it("returns a promise when some resources are still pending", () => {
      const domain = new Domain("en", createDelayedResolver(modules, 50), noFmt);
      domain.pickR("common");

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("pickRKit", () => {
    it("returns a resolved promise for empty namespace list", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      const result = domain.pickRKit([]);
      expect(result).toBeInstanceOf(Promise);
      expect(await result).toEqual([]);
    });

    it("returns a resolved promise when all resources are cached", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.pickRKit(["common", "nav"]);

      const result = domain.pickRKit(["common", "nav"]);
      expect(result).toBeInstanceOf(Promise);
      expect(await result).toEqual([commonR, navR]);
    });

    it("calls the resolver only once per namespace across multiple kit requests", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver, noFmt);

      await domain.pickRKit(["common", "nav"]);
      await domain.pickRKit(["common", "nav"]);

      expect(resolver).toHaveBeenCalledTimes(2);
    });
  });

  describe("cross-method caching", () => {
    it("pickR resolves cache used by hybridPickR", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.pickR("common");

      const result = domain.hybridPickR("common");
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toBe(commonR);
    });

    it("hybridPickR resolves cache used by pickR", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.hybridPickR("common");

      const result = await domain.pickR("common");
      expect(result).toBe(commonR);
    });

    it("pickR resolves cache used by hybridPickRKit", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.pickR("common");
      await domain.pickR("nav");

      const result = domain.hybridPickRKit(["common", "nav"]);
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toEqual([commonR, navR]);
    });

    it("pickRKit resolves cache used by hybridPickR", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);
      await domain.pickRKit(["common", "nav"]);

      const r = domain.hybridPickR("common");
      expect(r).not.toBeInstanceOf(Promise);
      expect(r).toBe(commonR);
    });

    it("hybridPickRKit resolves cache used by pickR", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver, noFmt);
      await domain.hybridPickRKit(["common", "nav"]);

      resolver.mockClear();
      await domain.pickR("common");

      expect(resolver).not.toHaveBeenCalled();
    });
  });

  describe("concurrent resolution behavior", () => {
    it("deduplicates concurrent pickR calls for the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const domain = new Domain("en", resolver, noFmt);

      const [r1, r2] = await Promise.all([domain.pickR("common"), domain.pickR("common")]);

      expect(r1).toBe(commonR);
      expect(r2).toBe(commonR);
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    it("deduplicates concurrent hybridPickR calls for the same namespace", async () => {
      const resolver = vi.fn<RModuleResolver>(() => Promise.resolve({ default: commonR }));
      const domain = new Domain("en", resolver, noFmt);

      const [r1, r2] = await Promise.all([
        Promise.resolve(domain.hybridPickR("common")),
        Promise.resolve(domain.hybridPickR("common")),
      ]);

      expect(r1).toBe(commonR);
      expect(r2).toBe(commonR);
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    it("resolves multiple kits sharing namespaces without extra resolver calls", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver, noFmt);

      const [kit1, kit2] = await Promise.all([
        domain.pickRKit(["common", "nav"]),
        domain.pickRKit(["common", "footer"]),
      ]);

      expect(kit1).toEqual([commonR, navR]);
      expect(kit2).toEqual([commonR, footerR]);
      expect(resolver).toHaveBeenCalledTimes(3);
    });

    it("pending RKit promise is cleaned up after resolution", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);

      const kit1 = domain.pickRKit(["common", "nav"]);
      const kit1Duplicate = domain.pickRKit(["common", "nav"]);
      expect(kit1).toBe(kit1Duplicate);

      await kit1;

      const kit2 = domain.pickRKit(["common", "nav"]);
      expect(kit2).not.toBe(kit1);
    });

    it("pending RKit promise is cleaned up after rejection", async () => {
      const domain = new Domain("en", createMockResolver(modules), noFmt);

      const kit1 = domain.pickRKit(["common", "nonexistent"]);
      await expect(kit1).rejects.toThrow();

      const kit2 = domain.pickRKit(["common", "nonexistent"]);
      expect(kit2).not.toBe(kit1);
      await expect(kit2).rejects.toThrow();
    });
  });

  describe("race condition: reject + retry", () => {
    it("hybridPickR called during in-flight reject allows successful retry", async () => {
      let callCount = 0;
      let rejectFn: (reason: Error) => void;
      const resolver: RModuleResolver = () => {
        callCount++;
        if (callCount === 1) {
          return new Promise((_resolve, reject) => {
            rejectFn = reject;
          });
        }
        return Promise.resolve({ default: commonR });
      };

      const domain = new Domain("en", resolver, noFmt);

      const first = domain.hybridPickR("common");
      expect(first).toBeInstanceOf(Promise);

      const second = domain.hybridPickR("common");
      expect(second).toBe(first);

      rejectFn!(new Error("transient failure"));
      await expect(first).rejects.toThrow();

      const retry = await domain.hybridPickR("common");
      expect(retry).toBe(commonR);
    });
  });

  describe("error handling", () => {
    it("rejects with an error when the module resolver rejects", async () => {
      const resolver: RModuleResolver = () => Promise.reject(new Error("network error"));
      const domain = new Domain("en", resolver, noFmt);

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
      const domain = new Domain("en", resolver, noFmt);

      await expect(domain.pickR("common")).rejects.toThrow();

      shouldFail = false;
      const result = await domain.pickR("common");
      expect(result).toBe(commonR);
    });

    it("one namespace failure in a kit rejects the entire kit", async () => {
      const failingModules: Record<string, Record<string, AnyRModule>> = {
        en: { common: { default: commonR } },
      };
      const domain = new Domain("en", createMockResolver(failingModules), noFmt);

      await expect(domain.pickRKit(["common", "nav"])).rejects.toThrow();
    });

    it("successful namespaces in a failed kit remain cached", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        if (namespace === "fail") {
          return Promise.reject(new Error("fail"));
        }
        return Promise.resolve({ default: commonR });
      });
      const domain = new Domain("en", resolver, noFmt);

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

      const domain = new Domain("en", resolver, noFmt);
      domain.pickR("slow-fail");

      const kitPromise = domain.hybridPickRKit(["common", "slow-fail"]);
      expect(kitPromise).toBeInstanceOf(Promise);

      rejectFn!(new Error("delayed failure"));

      await expect(kitPromise).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
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
      const domain = new Domain("en", resolver, noFmt);

      const kitSingle = await domain.pickRKit(["a⨆b"]);
      expect(kitSingle).toEqual([r1]);

      const domain2 = new Domain("en", resolver, noFmt);
      const kitMulti = await domain2.pickRKit(["a", "b"]);
      expect(kitMulti).toEqual([r2, { id: 3 }]);
    });

    it("pickRKit with duplicate namespaces returns duplicated entries", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver, noFmt);

      const kit = await domain.pickRKit(["common", "common"]);
      expect(kit).toEqual([commonR, commonR]);
    });

    it("pickRKit with pre-cached duplicate namespaces resolves only once", async () => {
      const resolver = vi.fn<RModuleResolver>((namespace) => {
        const mod = modules.en[namespace];
        if (!mod) return Promise.reject(new Error("not found"));
        return Promise.resolve(mod);
      });
      const domain = new Domain("en", resolver, noFmt);

      await domain.pickR("common");
      resolver.mockClear();

      const kit = await domain.pickRKit(["common", "common"]);
      expect(kit).toEqual([commonR, commonR]);
      expect(kit[0]).toBe(kit[1]);
      expect(resolver).not.toHaveBeenCalled();
    });

    it("each Domain instance has its own independent cache", async () => {
      const resolver = createMockResolver(modules);
      const domain1 = new Domain("en", resolver, noFmt);
      const domain2 = new Domain("en", resolver, noFmt);

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

      const domain = new Domain("en", resolver, noFmt);

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

import { describe, expect, test } from "vitest";
import { createConfig } from "../config.js";
import { RMachineError } from "../error.js";
import type { AtlasNamespace } from "../r.js";
import { typeRef } from "../utils.js";

describe("createConfig", () => {
  test("should not return the original config", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      fallbackLocale: "en",
      rLoader: async (locale: "en" | "it", namespace: AtlasNamespace<Atlas>) => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    const config = createConfig(typeRef<Atlas>(), baseConfig);

    expect(config).not.toBe(baseConfig);
  });

  test("should return a config with the same properties as the original", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      fallbackLocale: "en",
      rLoader: async (locale: "en" | "it", namespace: AtlasNamespace<Atlas>) => {
        return { message: `${namespace} in ${locale}` };
      },
      namespacesToPreload: ["ns1"],
    } as const;

    const config = createConfig(typeRef<Atlas>(), baseConfig);

    expect(config).toEqual(baseConfig);
  });

  test("should throw if no locales are provided", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: [] as any,
      fallbackLocale: "en",
      rLoader: async (locale: "en" | "it", namespace: AtlasNamespace<Atlas>) => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError(RMachineError);
    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError("R-Machine Error: No locales provided");
  });

  test("should throw if locales contains duplicates", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it", "en"],
      fallbackLocale: "en",
      rLoader: async (locale: "en" | "it", namespace: AtlasNamespace<Atlas>) => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError(RMachineError);
    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError(
      "R-Machine Error: Duplicate locales provided"
    );
  });

  test("should throw if fallback locale is not in the list of locales", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["it"],
      fallbackLocale: "en" as any,
      rLoader: async (locale: "en" | "it", namespace: AtlasNamespace<Atlas>) => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError(RMachineError);
    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError(
      `R-Machine Error: Fallback locale "en" is not in the list of locales`
    );
  });

  test("should set namespacesToPreload to an empty array if not provided", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      fallbackLocale: "en",
      rLoader: async (locale: "en" | "it", namespace: AtlasNamespace<Atlas>) => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    const config = createConfig(typeRef<Atlas>(), baseConfig);

    expect(config.namespacesToPreload).toEqual([]);
  });
});

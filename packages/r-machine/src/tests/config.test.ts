import { describe, expect, test } from "vitest";
import { createConfig } from "../config.js";
import type { AtlasNamespace } from "../r.js";
import { typeRef } from "../utils.js";

describe("createConfig", () => {
  test("should not return the original config", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      loader: async (namespace: AtlasNamespace<Atlas>, locale: "en" | "it") => {
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
      defaultLocale: "en",
      loader: async (namespace: AtlasNamespace<Atlas>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
      preloadResources: ["ns1"],
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
      defaultLocale: "en",
      loader: async (namespace: AtlasNamespace<Atlas>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError("No locales provided");
  });

  test("should throw if locales contains duplicates", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it", "en"],
      defaultLocale: "en",
      loader: async (namespace: AtlasNamespace<Atlas>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError("Duplicate locales provided");
  });

  test("should throw if default locale is not in the list of locales", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["it"],
      defaultLocale: "en" as any,
      loader: async (namespace: AtlasNamespace<Atlas>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeRef<Atlas>(), baseConfig)).toThrowError(
      'Default locale "en" is not in the list of locales'
    );
  });

  test("should set preloadResources to an empty array if not provided", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      loader: async (namespace: AtlasNamespace<Atlas>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    const config = createConfig(typeRef<Atlas>(), baseConfig);

    expect(config.preloadResources).toEqual([]);
  });
});

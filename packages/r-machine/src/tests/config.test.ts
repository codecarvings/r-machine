import { describe, expect, test } from "vitest";
import { createConfig } from "../config.js";
import type { NamespaceOf } from "../resource.js";
import { typeOf } from "../utils.js";

describe("createConfig", () => {
  test("should not return the original config", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      preloadResources: ["common"],
      loader: async (namespace: NamespaceOf<Resources>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    const config = createConfig(typeOf<Resources>(), baseConfig);

    expect(config).not.toBe(baseConfig);
  });

  test("should return a config with the same properties as the original", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      loader: async (namespace: NamespaceOf<Resources>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
      preloadResources: ["common"],
    } as const;

    const config = createConfig(typeOf<Resources>(), baseConfig);

    expect(config).toEqual(baseConfig);
  });

  test("should throw if no locales are provided", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: [] as any,
      defaultLocale: "en",
      loader: async (namespace: NamespaceOf<Resources>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeOf<Resources>(), baseConfig)).toThrowError("No locales provided");
  });

  test("should throw if locales contains duplicates", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it", "en"],
      defaultLocale: "en",
      loader: async (namespace: NamespaceOf<Resources>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeOf<Resources>(), baseConfig)).toThrowError("Duplicate locales provided");
  });

  test("should throw if default locale is not in the list of locales", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: ["it"],
      defaultLocale: "en" as any,
      loader: async (namespace: NamespaceOf<Resources>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    expect(() => createConfig(typeOf<Resources>(), baseConfig)).toThrowError(
      'Default locale "en" is not in the list of locales'
    );
  });

  test("should set preloadResources to an empty array if not provided", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      loader: async (namespace: NamespaceOf<Resources>, locale: "en" | "it") => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    const config = createConfig(typeOf<Resources>(), baseConfig);

    expect(config.preloadResources).toEqual([]);
  });
});

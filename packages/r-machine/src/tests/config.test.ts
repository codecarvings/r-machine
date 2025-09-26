import { describe, expect, test } from "vitest";
import { createConfig } from "../config.js";
import { typeOf } from "../utils.js";

describe("createConfig", () => {
  test("should return the provided config", () => {
    type Resources = {
      common: { message: string };
    };

    const baseConfig = {
      locales: ["en", "it"],
      defaultLocale: "en",
      preloadResources: ["common"],
      loader: async (locale: "en" | "it", namespace: keyof Resources) => {
        return { message: `${namespace} in ${locale}` };
      },
    } as const;

    const config = createConfig(typeOf<Resources>(), baseConfig);

    expect(config).toBe(baseConfig);
  });
});

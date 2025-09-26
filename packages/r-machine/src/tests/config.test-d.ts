import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";
import { type Config, createConfig } from "../config.js";
import { typeOf } from "../utils.js";

describe("createConfig", () => {
  test("should return the right config type", () => {
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

    expectTypeOf(config).toEqualTypeOf<Config<"en" | "it", Resources>>();
  });
});

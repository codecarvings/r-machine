import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";
import { type Config, createConfig } from "../config.js";
import { typeOf } from "../utils.js";

describe("createConfig", () => {
  test("should return the right config type", () => {
    type Resources = {
      common: { message: string };
    };

    const config = createConfig(typeOf<Resources>(), {
      locales: ["en", "it"],
      defaultLocale: "en",
      loader: async (namespace, locale) => {
        return { message: `${namespace} in ${locale}` };
      },
    });

    expectTypeOf(config).toEqualTypeOf<Config<Resources, readonly ["en", "it"]>>();
  });
});

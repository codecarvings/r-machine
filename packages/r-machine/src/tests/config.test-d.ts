import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";
import { type Config, createConfig } from "../config.js";
import { typeRef } from "../utils.js";

describe("createConfig", () => {
  test("should return the right config type", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const locales = ["en", "it"] as const;

    const config = createConfig(typeRef<Atlas>(), {
      locales,
      defaultLocale: locales[0],
      loader: async (namespace, locale) => {
        return { message: `${namespace} in ${locale}` };
      },
    });

    expectTypeOf(config).toEqualTypeOf<Config<Atlas, (typeof locales)[number]>>();
  });
});

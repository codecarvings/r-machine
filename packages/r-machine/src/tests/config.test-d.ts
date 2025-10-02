import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";
import { type Config, createConfig } from "../config.js";
import { typeRef } from "../utils.js";

describe("createConfig", () => {
  test("should return the right config type", () => {
    type Atlas = {
      ns1: { message: string };
    };

    const config = createConfig(typeRef<Atlas>(), {
      locales: ["en", "it"],
      rLoader: async (namespace, locale) => {
        return { message: `${namespace} in ${locale}` };
      },
    });

    expectTypeOf(config).toEqualTypeOf<Config<Atlas>>();
  });
});

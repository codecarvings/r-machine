import { describe, expectTypeOf, it } from "vitest";
import type {
  ERR_FEATURE_REQUIRES_PROXY,
  ERR_INVALID_PATH,
  ERR_INVALID_STRATEGY_CONFIG,
  ERR_LOCALE_BIND_CONFLICT,
  ERR_LOCALE_UNDETERMINED,
  ERR_PATH_ATLAS_MALFORMED,
  ERR_PATH_TRANSLATION_FAILED,
  ERR_SERVER_ONLY,
} from "../../src/errors/index.js";

describe("errors barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf<typeof ERR_FEATURE_REQUIRES_PROXY>().toEqualTypeOf<"ERR_FEATURE_REQUIRES_PROXY">();
    expectTypeOf<typeof ERR_INVALID_PATH>().toEqualTypeOf<"ERR_INVALID_PATH">();
    expectTypeOf<typeof ERR_INVALID_STRATEGY_CONFIG>().toEqualTypeOf<"ERR_INVALID_STRATEGY_CONFIG">();
    expectTypeOf<typeof ERR_LOCALE_BIND_CONFLICT>().toEqualTypeOf<"ERR_LOCALE_BIND_CONFLICT">();
    expectTypeOf<typeof ERR_LOCALE_UNDETERMINED>().toEqualTypeOf<"ERR_LOCALE_UNDETERMINED">();
    expectTypeOf<typeof ERR_PATH_ATLAS_MALFORMED>().toEqualTypeOf<"ERR_PATH_ATLAS_MALFORMED">();
    expectTypeOf<typeof ERR_PATH_TRANSLATION_FAILED>().toEqualTypeOf<"ERR_PATH_TRANSLATION_FAILED">();
    expectTypeOf<typeof ERR_SERVER_ONLY>().toEqualTypeOf<"ERR_SERVER_ONLY">();
  });
});

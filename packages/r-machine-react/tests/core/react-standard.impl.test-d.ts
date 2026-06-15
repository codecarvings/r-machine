import type { RMachine } from "r-machine";
import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { describe, expectTypeOf, it } from "vitest";
import { createReactStandardImpl } from "../../src/core/react-standard.impl.js";
import type { AnyReactStandardStrategyConfig } from "../../src/core/react-standard-strategy-core.js";
import type { ReactImpl } from "../../src/core/react-toolset.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type EF = ExperimentalFlags;
type Cfg = AnyReactStandardStrategyConfig<TestAtlas>;

describe("createReactStandardImpl — function signature", () => {
  const fn = createReactStandardImpl<TestAtlas, AnyLocale, E, EF, Cfg>;

  it("is a function taking (RMachine<RA, L, E, EF>, config) and returning Promise<ReactImpl<L>>", () => {
    expectTypeOf(createReactStandardImpl).toBeFunction();
    expectTypeOf(fn).parameter(0).toEqualTypeOf<RMachine<TestAtlas, AnyLocale, E, EF>>();
    expectTypeOf(fn).parameter(1).toEqualTypeOf<Cfg>();
    expectTypeOf(fn).returns.toEqualTypeOf<Promise<ReactImpl<AnyLocale>>>();
  });
});

describe("createReactStandardImpl — narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("returns ReactImpl narrowed to L (readLocale / writeLocale follow)", () => {
    type Resolved = Awaited<
      ReturnType<typeof createReactStandardImpl<TestAtlas, AppLocale, E, EF, AnyReactStandardStrategyConfig<TestAtlas>>>
    >;
    expectTypeOf<Resolved>().toEqualTypeOf<ReactImpl<AppLocale>>();
    expectTypeOf<Resolved["readLocale"]>().returns.toEqualTypeOf<AppLocale | Promise<AppLocale>>();
    expectTypeOf<Resolved["writeLocale"]>().parameter(0).toEqualTypeOf<AppLocale>();
  });
});

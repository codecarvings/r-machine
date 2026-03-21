import type { AnyFmtProvider, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { CustomLocaleDetector, CustomLocaleStore } from "r-machine/strategy";
import { describe, expectTypeOf, it } from "vitest";
import type {
  PartialReactStandardStrategyConfig,
  ReactStandardStrategyConfig,
} from "../../src/core/react-standard-strategy-core.js";
import { ReactStandardStrategyCore } from "../../src/core/react-standard-strategy-core.js";
import type { ReactStrategyCore } from "../../src/core/react-strategy-core.js";
import type { ReactImpl, ReactToolset } from "../../src/core/react-toolset.js";

// ---------------------------------------------------------------------------
// Test resource atlas types
// ---------------------------------------------------------------------------

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

// Concrete subclass for testing the abstract class
class ConcreteStandardStrategy extends ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider> {
  // createImpl is already implemented by ReactStandardStrategyCore
}

// ---------------------------------------------------------------------------
// ReactStandardStrategyConfig
// ---------------------------------------------------------------------------

describe("ReactStandardStrategyConfig", () => {
  it("has a readonly localeDetector field typed as CustomLocaleDetector | undefined", () => {
    expectTypeOf<ReactStandardStrategyConfig["localeDetector"]>().toEqualTypeOf<CustomLocaleDetector | undefined>();
  });

  it("has a readonly localeStore field typed as CustomLocaleStore | undefined", () => {
    expectTypeOf<ReactStandardStrategyConfig["localeStore"]>().toEqualTypeOf<CustomLocaleStore | undefined>();
  });

  it("has exactly two keys", () => {
    type Keys = keyof ReactStandardStrategyConfig;
    expectTypeOf<Keys>().toEqualTypeOf<"localeDetector" | "localeStore">();
  });

  it("requires both fields to be present (not optional)", () => {
    expectTypeOf<{
      readonly localeDetector: undefined;
      readonly localeStore: undefined;
    }>().toExtend<ReactStandardStrategyConfig>();
    expectTypeOf<{
      readonly localeDetector: CustomLocaleDetector | undefined;
      readonly localeStore: CustomLocaleStore | undefined;
    }>().toEqualTypeOf<ReactStandardStrategyConfig>();
  });

  it("is not assignable from an empty object", () => {
    expectTypeOf<{}>().not.toExtend<ReactStandardStrategyConfig>();
  });

  it("is not assignable from a partial object missing localeDetector", () => {
    expectTypeOf<{ readonly localeStore: undefined }>().not.toExtend<ReactStandardStrategyConfig>();
  });

  it("is not assignable from a partial object missing localeStore", () => {
    expectTypeOf<{ readonly localeDetector: undefined }>().not.toExtend<ReactStandardStrategyConfig>();
  });

  it("accepts sync localeDetector", () => {
    expectTypeOf<{
      readonly localeDetector: () => string;
      readonly localeStore: undefined;
    }>().toExtend<ReactStandardStrategyConfig>();
  });

  it("accepts async localeDetector", () => {
    expectTypeOf<{
      readonly localeDetector: () => Promise<string>;
      readonly localeStore: undefined;
    }>().toExtend<ReactStandardStrategyConfig>();
  });

  it("accepts CustomLocaleStore with sync methods", () => {
    expectTypeOf<{
      readonly localeDetector: undefined;
      readonly localeStore: {
        readonly get: () => string | undefined;
        readonly set: (locale: string) => void;
      };
    }>().toExtend<ReactStandardStrategyConfig>();
  });

  it("accepts CustomLocaleStore with async methods", () => {
    expectTypeOf<{
      readonly localeDetector: undefined;
      readonly localeStore: {
        readonly get: () => Promise<string | undefined>;
        readonly set: (locale: string) => Promise<void>;
      };
    }>().toExtend<ReactStandardStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// PartialReactStandardStrategyConfig
// ---------------------------------------------------------------------------

describe("PartialReactStandardStrategyConfig", () => {
  it("has the same keys as ReactStandardStrategyConfig", () => {
    type Keys = keyof PartialReactStandardStrategyConfig;
    expectTypeOf<Keys>().toEqualTypeOf<"localeDetector" | "localeStore">();
  });

  it("allows omitting localeDetector", () => {
    expectTypeOf<{ readonly localeStore: undefined }>().toExtend<PartialReactStandardStrategyConfig>();
  });

  it("allows omitting localeStore", () => {
    expectTypeOf<{ readonly localeDetector: undefined }>().toExtend<PartialReactStandardStrategyConfig>();
  });

  it("allows an empty object", () => {
    expectTypeOf<{}>().toExtend<PartialReactStandardStrategyConfig>();
  });

  it("is a supertype of ReactStandardStrategyConfig", () => {
    expectTypeOf<ReactStandardStrategyConfig>().toExtend<PartialReactStandardStrategyConfig>();
  });

  it("is not a subtype of ReactStandardStrategyConfig", () => {
    expectTypeOf<PartialReactStandardStrategyConfig>().not.toEqualTypeOf<ReactStandardStrategyConfig>();
  });
});

// ---------------------------------------------------------------------------
// ReactStandardStrategyCore — class shape & inheritance
// ---------------------------------------------------------------------------

describe("ReactStandardStrategyCore", () => {
  describe("class shape", () => {
    it("extends ReactStrategyCore<RA, L, ReactStandardStrategyConfig>", () => {
      expectTypeOf<ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>>().toExtend<
        ReactStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider, ReactStandardStrategyConfig>
      >();
    });

    it("is abstract — concrete subclass is constructible", () => {
      expectTypeOf(ConcreteStandardStrategy).toBeConstructibleWith(
        {} as RMachine<TestAtlas, AnyLocale, AnyFmtProvider>,
        {} as ReactStandardStrategyConfig
      );
    });

    it("rMachine property is typed as RMachine<RA, L>", () => {
      expectTypeOf<ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>["rMachine"]>().toEqualTypeOf<
        RMachine<TestAtlas, AnyLocale, AnyFmtProvider>
      >();
    });

    it("config property is typed as ReactStandardStrategyConfig", () => {
      expectTypeOf<
        ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>["config"]
      >().toEqualTypeOf<ReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // static defaultConfig
  // -----------------------------------------------------------------------

  describe("static defaultConfig", () => {
    it("is typed as ReactStandardStrategyConfig", () => {
      expectTypeOf(ReactStandardStrategyCore.defaultConfig).toEqualTypeOf<ReactStandardStrategyConfig>();
    });

    it("is accessible from a concrete subclass", () => {
      expectTypeOf(ConcreteStandardStrategy.defaultConfig).toEqualTypeOf<ReactStandardStrategyConfig>();
    });
  });

  // -----------------------------------------------------------------------
  // createToolset return type
  // -----------------------------------------------------------------------

  describe("createToolset", () => {
    it("returns Promise<ReactToolset<RA, L>>", () => {
      expectTypeOf<
        ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>["createToolset"]
      >().returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas, AnyLocale>>>();
    });

    it("takes no parameters", () => {
      expectTypeOf<
        ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>["createToolset"]
      >().parameters.toEqualTypeOf<[]>();
    });

    it("preserves the atlas type parameter in the returned toolset", () => {
      type Result = Awaited<
        ReturnType<ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>["createToolset"]>
      >;
      expectTypeOf<Result>().toEqualTypeOf<ReactToolset<TestAtlas, AnyLocale>>();
    });
  });

  // -----------------------------------------------------------------------
  // createImpl (protected, implemented)
  // -----------------------------------------------------------------------

  describe("createImpl", () => {
    it("can be overridden to return Promise<ReactImpl<L>>", () => {
      class OverriddenStrategy extends ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider> {
        protected override createImpl(): Promise<ReactImpl<AnyLocale>> {
          return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
        }
      }
      expectTypeOf<OverriddenStrategy>().toExtend<ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>>();
    });

    it("has access to rMachine and config from the base class", () => {
      class AccessingStrategy extends ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider> {
        protected override createImpl(): Promise<ReactImpl<AnyLocale>> {
          const _machine: RMachine<TestAtlas, AnyLocale, AnyFmtProvider> = this.rMachine;
          const _config: ReactStandardStrategyConfig = this.config;
          return Promise.resolve({ readLocale: () => "en", writeLocale: () => {} });
        }
      }
      expectTypeOf<AccessingStrategy>().toExtend<ReactStandardStrategyCore<TestAtlas, AnyLocale, AnyFmtProvider>>();
    });
  });
});

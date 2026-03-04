import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNextAppFlatStrategyConfig,
  AnyNextAppOriginStrategyConfig,
  AnyNextAppPathStrategyConfig,
  AnyNextAppStrategyConfig,
  LocaleOriginMap,
  NextAppClientImpl,
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppFlatStrategyCore,
  NextAppNoProxyServerImpl,
  NextAppNoProxyServerToolset,
  NextAppOriginStrategyCore,
  NextAppOriginStrategyUrlTranslator,
  NextAppPathStrategyCore,
  NextAppPathStrategyPathCanonicalizer,
  NextAppPathStrategyPathTranslator,
  NextAppServerImpl,
  NextAppServerRMachine,
  NextAppServerToolset,
  NextAppStrategyCore,
  PartialNextAppFlatStrategyConfig,
  PartialNextAppOriginStrategyConfig,
  PartialNextAppPathStrategyConfig,
  PartialNextAppStrategyConfig,
} from "../../../src/core/app/index.js";
import {
  createNextAppClientToolset,
  createNextAppNoProxyServerToolset,
  createNextAppServerToolset,
  localeHeaderName,
} from "../../../src/core/app/index.js";

describe("core/app barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(localeHeaderName).toBeString();

    expectTypeOf<NextAppStrategyCore<any, any>>().toBeObject();

    expectTypeOf<NextAppFlatStrategyCore<any, any>>().toBeObject();

    expectTypeOf<NextAppOriginStrategyCore<any, any>>().toBeObject();

    expectTypeOf<NextAppOriginStrategyUrlTranslator>().toBeObject();

    expectTypeOf<NextAppPathStrategyCore<any, any>>().toBeObject();

    expectTypeOf<NextAppPathStrategyPathTranslator>().toBeObject();

    expectTypeOf<NextAppPathStrategyPathCanonicalizer>().toBeObject();

    expectTypeOf(createNextAppClientToolset).toBeFunction();

    expectTypeOf(createNextAppServerToolset).toBeFunction();

    expectTypeOf(createNextAppNoProxyServerToolset).toBeFunction();

    expectTypeOf<AnyNextAppStrategyConfig>().toBeObject();

    expectTypeOf<PartialNextAppStrategyConfig<any, any>>().toBeObject();

    expectTypeOf<NextAppClientImpl>().toBeObject();

    expectTypeOf<NextAppClientRMachine>().toBeFunction();

    expectTypeOf<NextAppClientToolset<any, any>>().toBeObject();

    expectTypeOf<NextAppServerImpl>().toBeObject();

    expectTypeOf<NextAppServerRMachine>().toBeFunction();

    expectTypeOf<NextAppServerToolset<any, any, any>>().toBeObject();

    expectTypeOf<NextAppNoProxyServerImpl>().toBeObject();

    expectTypeOf<NextAppNoProxyServerToolset<any, any, any>>().toBeObject();

    expectTypeOf<AnyNextAppFlatStrategyConfig>().toBeObject();

    expectTypeOf<PartialNextAppFlatStrategyConfig<any, any>>().toBeObject();

    expectTypeOf<LocaleOriginMap>().toBeObject();

    expectTypeOf<AnyNextAppOriginStrategyConfig>().toBeObject();

    expectTypeOf<PartialNextAppOriginStrategyConfig<any, any>>().toBeObject();

    expectTypeOf<AnyNextAppPathStrategyConfig>().toBeObject();

    expectTypeOf<PartialNextAppPathStrategyConfig<any, any>>().toBeObject();
  });
});

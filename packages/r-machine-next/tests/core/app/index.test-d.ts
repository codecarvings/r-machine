import { describe, expectTypeOf, it } from "vitest";
import type {
  AnyNextAppStrategyConfig,
  NextAppClientImpl,
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppNoProxyServerImpl,
  NextAppNoProxyServerToolset,
  NextAppServerImpl,
  NextAppServerRMachine,
  NextAppServerToolset,
  NextAppStrategyCore,
  PartialNextAppStrategyConfig,
} from "../../../src/core/app/index.js";
import {
  createNextAppClientToolset,
  createNextAppNoProxyServerToolset,
  createNextAppServerToolset,
  localeHeaderName,
} from "../../../src/core/app/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core/app barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(localeHeaderName).toBeString();

    expectTypeOf<NextAppStrategyCore<any, any, any, any>>().toBeObject();

    expectTypeOf(createNextAppClientToolset).toBeFunction();

    expectTypeOf(createNextAppServerToolset).toBeFunction();

    expectTypeOf(createNextAppNoProxyServerToolset).toBeFunction();

    expectTypeOf<AnyNextAppStrategyConfig>().toBeObject();

    expectTypeOf<PartialNextAppStrategyConfig<any, any>>().toBeObject();

    expectTypeOf<NextAppClientImpl<any>>().toBeObject();

    expectTypeOf<NextAppClientRMachine<any>>().toBeFunction();

    expectTypeOf<NextAppClientToolset<any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppServerImpl<any, any>>().toBeObject();

    expectTypeOf<NextAppServerRMachine>().toBeFunction();

    expectTypeOf<NextAppServerToolset<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppNoProxyServerImpl<any, any>>().toBeObject();

    expectTypeOf<NextAppNoProxyServerToolset<any, any, any, any, any>>().toBeObject();
  });
});

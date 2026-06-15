import { describe, expectTypeOf, it } from "vitest";
import type {
  NextAppClientImpl,
  NextAppClientRMachine,
  NextAppClientToolset,
  NextAppNoProxyServerImpl,
  NextAppNoProxyServerToolset,
  NextAppServerImpl,
  NextAppServerToolset,
  NextAppStrategyConfigParams,
  NextAppStrategyCore,
} from "../../../src/core/app/index.js";
import { localeHeaderName } from "../../../src/core/app/index.js";

// Barrel test: uses a single it() to verify export completeness only. Type shape tests belong in dedicated files.
describe("core/app barrel exports", () => {
  it("exports all expected symbols", () => {
    expectTypeOf(localeHeaderName).toBeString();

    expectTypeOf<NextAppStrategyCore<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppStrategyConfigParams<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppClientImpl<any>>().toBeObject();

    expectTypeOf<NextAppClientRMachine<any>>().toBeFunction();

    expectTypeOf<NextAppClientToolset<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppServerImpl<any, any>>().toBeObject();

    expectTypeOf<NextAppServerToolset<any, any, any, any, any>>().toBeObject();

    expectTypeOf<NextAppNoProxyServerImpl<any, any>>().toBeObject();

    expectTypeOf<NextAppNoProxyServerToolset<any, any, any, any, any>>().toBeObject();
  });
});

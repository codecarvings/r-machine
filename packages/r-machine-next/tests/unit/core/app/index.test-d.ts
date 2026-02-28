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
} from "../../../../src/core/app/index.js";
import {
  createNextAppClientToolset,
  createNextAppNoProxyServerToolset,
  createNextAppServerToolset,
  localeHeaderName,
} from "../../../../src/core/app/index.js";

describe("core/app barrel exports", () => {
  it("should export localeHeaderName as a string", () => {
    expectTypeOf(localeHeaderName).toBeString();
  });

  it("should export NextAppStrategyCore as a class", () => {
    expectTypeOf<NextAppStrategyCore<any, any>>().toBeObject();
  });

  it("should export NextAppFlatStrategyCore as a class", () => {
    expectTypeOf<NextAppFlatStrategyCore<any, any>>().toBeObject();
  });

  it("should export NextAppOriginStrategyCore as a class", () => {
    expectTypeOf<NextAppOriginStrategyCore<any, any>>().toBeObject();
  });

  it("should export NextAppOriginStrategyUrlTranslator as a class", () => {
    expectTypeOf<NextAppOriginStrategyUrlTranslator>().toBeObject();
  });

  it("should export NextAppPathStrategyCore as a class", () => {
    expectTypeOf<NextAppPathStrategyCore<any, any>>().toBeObject();
  });

  it("should export NextAppPathStrategyPathTranslator as a class", () => {
    expectTypeOf<NextAppPathStrategyPathTranslator>().toBeObject();
  });

  it("should export NextAppPathStrategyPathCanonicalizer as a class", () => {
    expectTypeOf<NextAppPathStrategyPathCanonicalizer>().toBeObject();
  });

  it("should export createNextAppClientToolset as a function", () => {
    expectTypeOf(createNextAppClientToolset).toBeFunction();
  });

  it("should export createNextAppServerToolset as a function", () => {
    expectTypeOf(createNextAppServerToolset).toBeFunction();
  });

  it("should export createNextAppNoProxyServerToolset as a function", () => {
    expectTypeOf(createNextAppNoProxyServerToolset).toBeFunction();
  });

  it("should export NextAppStrategyConfig as an object type", () => {
    expectTypeOf<AnyNextAppStrategyConfig>().toBeObject();
  });

  it("should export PartialNextAppStrategyConfig as an object type", () => {
    expectTypeOf<PartialNextAppStrategyConfig<any, any>>().toBeObject();
  });

  it("should export NextAppClientImpl as an object type", () => {
    expectTypeOf<NextAppClientImpl>().toBeObject();
  });

  it("should export NextAppClientRMachine as a function type", () => {
    expectTypeOf<NextAppClientRMachine>().toBeFunction();
  });

  it("should export NextAppClientToolset as an object type", () => {
    expectTypeOf<NextAppClientToolset<any, any>>().toBeObject();
  });

  it("should export NextAppServerImpl as an object type", () => {
    expectTypeOf<NextAppServerImpl>().toBeObject();
  });

  it("should export NextAppServerRMachine as a function type", () => {
    expectTypeOf<NextAppServerRMachine>().toBeFunction();
  });

  it("should export NextAppServerToolset as an object type", () => {
    expectTypeOf<NextAppServerToolset<any, any, any>>().toBeObject();
  });

  it("should export NextAppNoProxyServerImpl as an object type", () => {
    expectTypeOf<NextAppNoProxyServerImpl>().toBeObject();
  });

  it("should export NextAppNoProxyServerToolset as an object type", () => {
    expectTypeOf<NextAppNoProxyServerToolset<any, any, any>>().toBeObject();
  });

  it("should export NextAppFlatStrategyConfig as an object type", () => {
    expectTypeOf<AnyNextAppFlatStrategyConfig>().toBeObject();
  });

  it("should export PartialNextAppFlatStrategyConfig as an object type", () => {
    expectTypeOf<PartialNextAppFlatStrategyConfig<any, any>>().toBeObject();
  });

  it("should export LocaleOriginMap as an object type", () => {
    expectTypeOf<LocaleOriginMap>().toBeObject();
  });

  it("should export NextAppOriginStrategyConfig as an object type", () => {
    expectTypeOf<AnyNextAppOriginStrategyConfig>().toBeObject();
  });

  it("should export PartialNextAppOriginStrategyConfig as an object type", () => {
    expectTypeOf<PartialNextAppOriginStrategyConfig<any, any>>().toBeObject();
  });

  it("should export NextAppPathStrategyConfig as an object type", () => {
    expectTypeOf<AnyNextAppPathStrategyConfig>().toBeObject();
  });

  it("should export PartialNextAppPathStrategyConfig as an object type", () => {
    expectTypeOf<PartialNextAppPathStrategyConfig<any, any>>().toBeObject();
  });
});

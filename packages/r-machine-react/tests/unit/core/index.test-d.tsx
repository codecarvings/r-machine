import type { AnyResourceAtlas } from "r-machine";
import { describe, expectTypeOf, it } from "vitest";
import type {
  PartialReactStandardStrategyConfig,
  ReactBareRMachine,
  ReactBareStrategy,
  ReactBareToolset,
  ReactImpl,
  ReactStandardStrategyConfig,
  ReactStandardStrategyCore,
  ReactStrategyCore,
  ReactToolset,
} from "../../../src/core/index.js";
import { createReactBareToolset, createReactToolset } from "../../../src/core/index.js";

describe("core barrel exports", () => {
  it("should export ReactBareStrategy as a class", () => {
    expectTypeOf<ReactBareStrategy<AnyResourceAtlas>>().toBeObject();
  });

  it("should export createReactBareToolset as a function", () => {
    expectTypeOf(createReactBareToolset).toBeFunction();
  });

  it("should export ReactBareRMachine as a function type", () => {
    expectTypeOf<ReactBareRMachine>().toBeFunction();
  });

  it("should export ReactBareToolset as an object type", () => {
    expectTypeOf<ReactBareToolset<AnyResourceAtlas>>().toBeObject();
  });

  it("should export ReactStandardStrategyConfig as an object type", () => {
    expectTypeOf<ReactStandardStrategyConfig>().toBeObject();
  });

  it("should export PartialReactStandardStrategyConfig as an object type", () => {
    expectTypeOf<PartialReactStandardStrategyConfig>().toBeObject();
  });

  it("should export ReactStandardStrategyCore as a class", () => {
    expectTypeOf<ReactStandardStrategyCore<AnyResourceAtlas>>().toBeObject();
  });

  it("should export ReactStrategyCore as a class", () => {
    expectTypeOf<ReactStrategyCore<AnyResourceAtlas, unknown>>().toBeObject();
  });

  it("should export createReactToolset as a function", () => {
    expectTypeOf(createReactToolset).toBeFunction();
  });

  it("should export ReactImpl as an object type", () => {
    expectTypeOf<ReactImpl>().toBeObject();
    expectTypeOf<ReactImpl>().toHaveProperty("readLocale");
    expectTypeOf<ReactImpl>().toHaveProperty("writeLocale");
  });

  it("should export ReactToolset as an object type", () => {
    expectTypeOf<ReactToolset<AnyResourceAtlas>>().toBeObject();
  });
});

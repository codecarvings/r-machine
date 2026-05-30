import { cleanup } from "@testing-library/react";
import type { CustomLocaleDetector } from "r-machine/strategy";
import { afterEach, describe, expect, it } from "vitest";
import { ReactStandardStrategyCore } from "#r-machine/react/core";
import { ReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";
import { syncStore } from "../_fixtures/mock-strategy-config.js";

afterEach(cleanup);

// `config` is protected on the Strategy base; read it structurally for assertions.
type ReadCfg = { localeDetector?: unknown; localeStore?: unknown };
const readConfig = (s: unknown): ReadCfg => (s as { config: ReadCfg }).config;

// ReactStandardStrategy.create(rMachine, params) is the public factory: it
// merges the partial params with the inherited defaultConfig and constructs
// the concrete strategy.
describe("ReactStandardStrategy.create — config merging with defaultConfig", () => {
  it("defaults both locale fields to undefined for an empty params object", () => {
    const strategy = ReactStandardStrategy.create(createMockMachine(), {});
    expect(readConfig(strategy).localeDetector).toBeUndefined();
    expect(readConfig(strategy).localeStore).toBeUndefined();
  });

  it("applies localeDetector while defaulting localeStore to undefined", () => {
    const detector: CustomLocaleDetector = () => "it";
    const strategy = ReactStandardStrategy.create(createMockMachine(), { localeDetector: detector });
    expect(readConfig(strategy).localeDetector).toBe(detector);
    expect(readConfig(strategy).localeStore).toBeUndefined();
  });

  it("applies localeStore while defaulting localeDetector to undefined", () => {
    const store = syncStore("en");
    const strategy = ReactStandardStrategy.create(createMockMachine(), { localeStore: store });
    expect(readConfig(strategy).localeDetector).toBeUndefined();
    expect(readConfig(strategy).localeStore).toBe(store);
  });

  it("applies both fields when both are provided", () => {
    const detector: CustomLocaleDetector = () => "it";
    const store = syncStore("en");
    const strategy = ReactStandardStrategy.create(createMockMachine(), {
      localeDetector: detector,
      localeStore: store,
    });
    expect(readConfig(strategy).localeDetector).toBe(detector);
    expect(readConfig(strategy).localeStore).toBe(store);
  });

  it("produces a config that is not the same reference as defaultConfig", () => {
    const strategy = ReactStandardStrategy.create(createMockMachine(), {});
    expect(readConfig(strategy)).not.toBe(ReactStandardStrategyCore.defaultConfig);
  });

  it("does not mutate defaultConfig when providing overrides", () => {
    const detector: CustomLocaleDetector = () => "it";
    ReactStandardStrategy.create(createMockMachine(), { localeDetector: detector });
    expect(ReactStandardStrategyCore.defaultConfig.localeDetector).toBeUndefined();
    expect(ReactStandardStrategyCore.defaultConfig.localeStore).toBeUndefined();
  });
});

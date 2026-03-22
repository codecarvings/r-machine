import { cleanup } from "@testing-library/react";
import type { CustomLocaleDetector } from "r-machine/strategy";
import { afterEach, describe, expect, it } from "vitest";
import { ReactStandardStrategyCore } from "#r-machine/react/core";
import { ReactStandardStrategy } from "../../src/lib/react-standard-strategy.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";
import { syncStore } from "../_fixtures/mock-strategy-config.js";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// ReactStandardStrategy
// ---------------------------------------------------------------------------

describe("ReactStandardStrategy", () => {
  // -----------------------------------------------------------------------
  // construction
  // -----------------------------------------------------------------------

  describe("construction", () => {
    it("accepts no config, partial config, or empty config", () => {
      const detector: CustomLocaleDetector = () => "en";
      const s1 = new ReactStandardStrategy(createMockMachine());
      const s2 = new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      const s3 = new ReactStandardStrategy(createMockMachine(), {});
      expect(s1.config).toBeDefined();
      expect(s2.config.localeDetector).toBe(detector);
      expect(s3.config).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // config merging with defaultConfig
  // -----------------------------------------------------------------------

  describe("config merging with defaultConfig", () => {
    it("defaults both fields to undefined when no config is provided", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("defaults both fields to undefined when an empty config is provided", () => {
      const strategy = new ReactStandardStrategy(createMockMachine(), {});
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("applies localeDetector while defaulting localeStore to undefined", () => {
      const detector: CustomLocaleDetector = () => "it";
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(strategy.config.localeDetector).toBe(detector);
      expect(strategy.config.localeStore).toBeUndefined();
    });

    it("applies localeStore while defaulting localeDetector to undefined", () => {
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeStore: store });
      expect(strategy.config.localeDetector).toBeUndefined();
      expect(strategy.config.localeStore).toBe(store);
    });

    it("applies both fields when both are provided", () => {
      const detector: CustomLocaleDetector = () => "it";
      const store = syncStore("en");
      const strategy = new ReactStandardStrategy(createMockMachine(), {
        localeDetector: detector,
        localeStore: store,
      });
      expect(strategy.config.localeDetector).toBe(detector);
      expect(strategy.config.localeStore).toBe(store);
    });

    it("user-provided values override defaultConfig (not the other way around)", () => {
      const detector: CustomLocaleDetector = () => "it";
      const strategy = new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(strategy.config.localeDetector).toBe(detector);
    });

    it("produces a config that is not the same reference as defaultConfig", () => {
      const strategy = new ReactStandardStrategy(createMockMachine());
      expect(strategy.config).not.toBe(ReactStandardStrategyCore.defaultConfig);
    });

    it("does not mutate defaultConfig when providing overrides", () => {
      const detector: CustomLocaleDetector = () => "it";
      new ReactStandardStrategy(createMockMachine(), { localeDetector: detector });
      expect(ReactStandardStrategyCore.defaultConfig.localeDetector).toBeUndefined();
      expect(ReactStandardStrategyCore.defaultConfig.localeStore).toBeUndefined();
    });
  });
});

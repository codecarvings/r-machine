import { Strategy } from "r-machine/strategy";
import { describe, expect, it } from "vitest";
import { ReactBareStrategy } from "../../src/core/react-bare-strategy.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

describe("ReactBareStrategy", () => {
  describe("construction", () => {
    it("can be instantiated with an RMachine and undefined config", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy).toBeInstanceOf(ReactBareStrategy);
    });

    it("extends Strategy", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy).toBeInstanceOf(Strategy);
    });

    it("exposes the rMachine property from the base class", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy.rMachine).toBe(machine);
    });

    it("exposes the config property as undefined", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy.config).toBeUndefined();
    });
  });

  describe("createToolset", () => {
    it("delegates to createReactBareToolset with the strategy's rMachine", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset = await strategy.createToolset();

      toolset.ReactRMachine.probe("en");
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("en");
    });

    it("produces independent toolsets on repeated calls", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      expect(toolset1).not.toBe(toolset2);
    });

    it("produces toolsets that share the same rMachine", async () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      const toolset1 = await strategy.createToolset();
      const toolset2 = await strategy.createToolset();

      toolset1.ReactRMachine.probe("en");
      toolset2.ReactRMachine.probe("it");

      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("en");
      expect(machine.localeHelper.validateLocale).toHaveBeenCalledWith("it");
    });
  });
});

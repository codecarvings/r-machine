import { describe, expect, it } from "vitest";
import { ReactBareStrategy } from "../../src/core/react-bare-strategy.js";
import { createMockMachine } from "../_fixtures/mock-machine.js";

describe("ReactBareStrategy", () => {
  describe("construction", () => {
    it("exposes rMachine and sets config to undefined", () => {
      const machine = createMockMachine();
      const strategy = new ReactBareStrategy(machine, undefined);
      expect(strategy.rMachine).toBe(machine);
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

import { mockPlug } from "@r-machine/testing";
import { dispose } from "r-machine";
import { afterAll, beforeAll, describe, expect, it, vitest } from "vitest";
import { r } from "@/r-machine/outer/timer";

describe("Outer_Timer", () => {
  beforeAll(() => {
    vitest.useFakeTimers();
  });

  it("should increment value every second - mocked", async () => {
    const reset = mockPlug(r.plug).with({
      $: {
        state: 10,
      },
      config: {
        appName: "Test App mocked",
      },
    });

    await using res = await r.create();

    expect(res.valueWithConfigName()).toBe("Test App mocked: 10");
    vitest.advanceTimersByTime(1000);
    expect(res.valueWithConfigName()).toBe("Test App mocked: 11");
    vitest.advanceTimersByTime(2000);
    expect(res.valueWithConfigName()).toBe("Test App mocked: 13");
    reset();
  });

  it("should increment value every second - unmocked", async () => {
    const res = await r.create();

    expect(res.valueWithConfigName()).toBe("Test App: 0");
    vitest.advanceTimersByTime(1000);
    expect(res.valueWithConfigName()).toBe("Test App: 1");
    vitest.advanceTimersByTime(2000);
    expect(res.valueWithConfigName()).toBe("Test App: 3");

    dispose(res);
  });

  it("should log multiples of 5", async () => {
    const consoleLogSpy = vitest.spyOn(console, "log").mockImplementation(() => {});

    const res = await r.create();
    res.$relay.onChange = (newValue: number) => {
      if (newValue % 5 === 0) {
        console.log(`Mocked - Value ${newValue} is a multiple of 5!`);
      }
    };

    vitest.advanceTimersByTime(5000);
    expect(consoleLogSpy).toHaveBeenCalledWith("Mocked - Value 5 is a multiple of 5!");

    vitest.advanceTimersByTime(5000);
    expect(consoleLogSpy).toHaveBeenCalledWith("Mocked - Value 10 is a multiple of 5!");

    consoleLogSpy.mockRestore();
    dispose(res);
  });

  it("should log multiples of 5 + 100", async () => {
    const consoleLogSpy = vitest.spyOn(console, "log").mockImplementation(() => {});

    const res = await r.create();
    res.$relay.select = () => res.value() + 100; // Select value + 100, so multiples of 5 become multiples of 5 + 100.
    res.$relay.onChange = (newValue: number) => {
      if (newValue % 5 === 0) {
        console.log(`Mocked - Value ${newValue} is 100 + a multiple of 5!`);
      }
    };

    vitest.advanceTimersByTime(5000);
    expect(consoleLogSpy).toHaveBeenCalledWith("Mocked - Value 105 is 100 + a multiple of 5!");

    vitest.advanceTimersByTime(5000);
    expect(consoleLogSpy).toHaveBeenCalledWith("Mocked - Value 110 is 100 + a multiple of 5!");

    consoleLogSpy.mockRestore();
    dispose(res);
  });

  it("should honor a reassigned equals comparator (live)", async () => {
    const consoleLogSpy = vitest.spyOn(console, "log").mockImplementation(() => {});

    const res = await r.create();
    // Treat every selected value as equal → onChange must never fire.
    // Proves `equals` is read live off the relay object, not captured at setup.
    res.$relay.equals = () => true;

    vitest.advanceTimersByTime(10000);
    expect(consoleLogSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    dispose(res);
  });

  afterAll(() => {
    vitest.useRealTimers();
  });
});

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

  afterAll(() => {
    vitest.useRealTimers();
  });
});

import { mockPlug } from "@r-machine/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { r } from "@/r-machine/pub/outer/timer";

// Fake timers freeze the gear-owned interval so the gear is deterministic and
// leaves no live interval behind.
describe("Outer_Timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("add() updates value; the cell doubles it; the relay derives odd/even", async () => {
    using ctrl = mockPlug(r).default();
    const timer = await ctrl.createRes(); // ctrl auto-disposes it on scope exit

    expect(timer.value).toBe(0);
    expect(timer.isOdd).toBe(false);
    expect(timer.doubled).toBe(0);

    timer.add(1);
    expect(timer.value).toBe(1);
    expect(timer.isOdd).toBe(true); // relay: 1 is odd
    expect(timer.doubled).toBe(2); // memoized cell

    timer.add(10);
    expect(timer.value).toBe(11);
    expect(timer.isOdd).toBe(true);
    expect(timer.doubled).toBe(22);
  });

  it("auto-increments on its gear-owned interval", async () => {
    using ctrl = mockPlug(r).default();
    const timer = await ctrl.createRes(); // ctrl auto-disposes it on scope exit

    expect(timer.value).toBe(0);
    await vi.advanceTimersByTimeAsync(3000); // 3 ticks at 1000ms
    expect(timer.value).toBe(3);
  });
});

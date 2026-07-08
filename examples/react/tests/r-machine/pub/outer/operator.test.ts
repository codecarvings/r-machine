import { mockPlug } from "@r-machine/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { r } from "@/r-machine/pub/outer/operator";

// operator depends on outer/timer (resolved real). Fake timers freeze the
// timer's interval so `value` only moves through the action under test.
describe("Outer_Operator", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("derives -timer.value and commands the timer via add10()", async () => {
    using ctrl = mockPlug(r).default();
    const operator = await ctrl.createRes();

    expect(operator.negative).toBe(-0); // -timer.value with value 0

    operator.add10(); // → timer.add(10)
    expect(operator.negative).toBe(-10);

    operator.add10();
    expect(operator.negative).toBe(-20);
  });
});

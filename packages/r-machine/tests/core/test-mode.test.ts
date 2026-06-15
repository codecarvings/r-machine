import { describe, expect, it } from "vitest";
import { TestMode } from "../../src/core/test-mode.js";

describe("TestMode", () => {
  it("starts disabled at epoch 0", () => {
    const tm = new TestMode();
    expect(tm.isEnabled).toBe(false);
    expect(tm.epoch).toBe(0);
  });

  it("enter() enables and bumps the epoch on the 0->1 transition", () => {
    const tm = new TestMode();
    tm.enter();
    expect(tm.isEnabled).toBe(true);
    expect(tm.epoch).toBe(1);
  });

  it("a nested enter() does NOT bump the epoch (only 0->1 does)", () => {
    const tm = new TestMode();
    tm.enter();
    tm.enter();
    expect(tm.epoch).toBe(1);
    expect(tm.isEnabled).toBe(true);
  });

  it("stays enabled until the last exit() (refcounted)", () => {
    const tm = new TestMode();
    tm.enter();
    tm.enter();
    tm.exit();
    expect(tm.isEnabled).toBe(true); // one enter still outstanding
    tm.exit();
    expect(tm.isEnabled).toBe(false);
    expect(tm.epoch).toBe(1); // exit never changes the epoch
  });

  it("bumps the epoch again on a fresh 0->1 re-entry", () => {
    const tm = new TestMode();
    tm.enter();
    tm.exit();
    tm.enter();
    expect(tm.epoch).toBe(2);
    expect(tm.isEnabled).toBe(true);
  });

  it("exit() from 0 is a defensive no-op (count never goes negative)", () => {
    const tm = new TestMode();
    tm.exit();
    expect(tm.isEnabled).toBe(false);
    expect(tm.epoch).toBe(0);
    // A later enter still works as a clean 0->1.
    tm.enter();
    expect(tm.isEnabled).toBe(true);
    expect(tm.epoch).toBe(1);
  });

  it("two controllers are isolated — entering one does not affect the other", () => {
    const a = new TestMode();
    const b = new TestMode();
    a.enter();
    expect(a.isEnabled).toBe(true);
    expect(b.isEnabled).toBe(false);
    expect(b.epoch).toBe(0);
  });
});

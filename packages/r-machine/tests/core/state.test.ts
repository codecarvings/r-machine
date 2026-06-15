import { describe, expect, it } from "vitest";
import { createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import { setStateAccess, tryGetStateAccess } from "../../src/core/state.js";
import { createStateCell } from "../../src/core/state-cell.js";

describe("state access symbol", () => {
  it("round-trips the StateCell stamped onto a target", () => {
    const target = {};
    const cell = createStateCell({ count: 0 }, createCassetteRecorder());

    setStateAccess(target, cell);

    expect(tryGetStateAccess(target)).toBe(cell);
  });

  it("returns undefined for a target with no state access stamped", () => {
    expect(tryGetStateAccess({})).toBeUndefined();
  });

  it("keeps the cell under a symbol key, invisible to string-key enumeration", () => {
    const target: Record<string, unknown> = { visible: 1 };
    setStateAccess(target, createStateCell(0, createCassetteRecorder()));

    expect(Object.keys(target)).toEqual(["visible"]);
  });

  it("overwrites a previously stamped cell", () => {
    const target = {};
    const first = createStateCell(1, createCassetteRecorder());
    const second = createStateCell(2, createCassetteRecorder());

    setStateAccess(target, first);
    setStateAccess(target, second);

    expect(tryGetStateAccess(target)).toBe(second);
  });
});

import { describe, expect, it } from "vitest";
import { createAction, isAction } from "../../src/core/action.js";
import { getMemberName } from "../../src/core/member-name.js";

describe("createAction", () => {
  it("brands the function in place and returns the very same reference", () => {
    const fn = (n: number) => n + 1;
    const action = createAction(fn, "inc");

    expect(action).toBe(fn);
    expect(action(1)).toBe(2);
    expect(isAction(action)).toBe(true);
  });

  it("stamps the member name", () => {
    const action = createAction(() => {}, "reset");
    expect(getMemberName(action)).toBe("reset");
  });
});

describe("isAction", () => {
  it("is true only for a branded action, false for a plain function", () => {
    expect(isAction(createAction(() => {}, "a"))).toBe(true);
    expect(isAction(() => {})).toBe(false);
  });

  it("is false for non-function values", () => {
    expect(isAction(42)).toBe(false);
    expect(isAction(null)).toBe(false);
    expect(isAction(undefined)).toBe(false);
    expect(isAction({})).toBe(false);
    expect(isAction("action")).toBe(false);
  });
});

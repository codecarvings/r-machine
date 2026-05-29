import { describe, expect, it, vi } from "vitest";
import {
  type AnyPlugHead,
  createPlug,
  getPlugHead,
  getPlugId,
  getPlugOutline,
  getPlugResolve,
  setPlugResolve,
} from "../../src/core/plug.js";
import { ERR_RESOLVE_FAILED, RMachineResolveError } from "../../src/errors/index.js";

// Minimal stand-in head; createPlug only stores it verbatim.
function fakeHead(mode: "map" | "list" = "map"): AnyPlugHead {
  return {
    realm: "res",
    mode,
    deps: mode === "map" ? {} : [],
    nsDeps: mode === "map" ? {} : [],
    nsDepList: [],
  } as unknown as AnyPlugHead;
}

describe("createPlug / getPlugHead", () => {
  it("stores the head verbatim (identity round-trip)", () => {
    const head = fakeHead();
    const plug = createPlug(head);

    expect(getPlugHead(plug)).toBe(head);
  });

  it("each plug gets a unique, stable id", () => {
    const a = createPlug(fakeHead());
    const b = createPlug(fakeHead());

    expect(typeof getPlugId(a)).toBe("symbol");
    expect(getPlugId(a)).toBe(getPlugId(a)); // stable
    expect(getPlugId(a)).not.toBe(getPlugId(b)); // unique
  });
});

describe("getPlugResolve / setPlugResolve", () => {
  it("the default resolve throws RMachineResolveError(ERR_RESOLVE_FAILED)", async () => {
    const plug = createPlug(fakeHead());
    try {
      await getPlugResolve(plug)(undefined, []);
      expect.unreachable("default resolve should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(RMachineResolveError);
      expect((err as RMachineResolveError).code).toBe(ERR_RESOLVE_FAILED);
    }
  });

  it("setPlugResolve installs a resolver that getPlugResolve returns", async () => {
    const plug = createPlug(fakeHead());
    const resolve = vi.fn(async () => ["resolved"] as never);
    setPlugResolve(plug, resolve);

    const out = await getPlugResolve(plug)("en", ["g/x"] as never);

    expect(out).toEqual(["resolved"]);
    expect(resolve).toHaveBeenCalledWith("en", ["g/x"]);
  });
});

describe("getPlugOutline — map vs list discrimination", () => {
  it("no arguments → empty map outline", () => {
    expect(getPlugOutline()).toEqual({ mode: "map", deps: {} });
  });

  it("a single non-handle object argument → map outline carrying that object", () => {
    const deps = { cfg: "b/config" };
    expect(getPlugOutline(deps)).toEqual({ mode: "map", deps });
  });

  it("a single handle (namespace string) argument → list outline", () => {
    const outline = getPlugOutline("b/config");
    expect(outline.mode).toBe("list");
    expect(outline.deps).toEqual(["b/config"]);
  });

  it("multiple arguments → list outline preserving order", () => {
    const outline = getPlugOutline("a", "b", "c");
    expect(outline.mode).toBe("list");
    expect(outline.deps).toEqual(["a", "b", "c"]);
  });
});

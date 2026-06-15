import { describe, expect, it, vi } from "vitest";
import {
  type AnyPlugHead,
  createPlug,
  getPlugHead,
  getPlugId,
  getPlugOutline,
  getPlugResolve,
  getPlugResolveSync,
  setPlugResolve,
  setPlugResolveSync,
} from "../../src/core/plug.js";
import { ASYNC } from "../../src/core/sync-resolve.js";
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

  it("the plug body is a callable no-op marker (HMR component-shaped export)", () => {
    // The plug is a function so HMR / React tooling treats the export as a
    // component; invoking it is a harmless no-op.
    const plug = createPlug(fakeHead());
    expect(typeof plug).toBe("function");
    expect((plug as unknown as () => unknown)()).toBeUndefined();
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

describe("getPlugResolveSync / setPlugResolveSync (Tier B)", () => {
  it("the default sync resolve declines with the ASYNC sentinel", () => {
    const plug = createPlug(fakeHead());
    expect(getPlugResolveSync(plug)(undefined, [])).toBe(ASYNC);
  });

  it("setPlugResolveSync installs a sync resolver that getPlugResolveSync returns", () => {
    const plug = createPlug(fakeHead());
    const resolve = vi.fn(() => ["sync"] as never);
    setPlugResolveSync(plug, resolve);

    const out = getPlugResolveSync(plug)("en", ["g/x"] as never);

    expect(out).toEqual(["sync"]);
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

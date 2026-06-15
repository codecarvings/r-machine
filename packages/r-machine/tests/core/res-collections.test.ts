import { describe, expect, it } from "vitest";
import { createToken, getNamespace } from "../../src/core/res-domain.js";
import { getNamespaceList, isNamespaceList } from "../../src/core/res-list.js";
import { getNamespaceMap } from "../../src/core/res-map.js";

// Dependency collections come in two shapes — positional lists and named maps.
// These utilities normalize handles (string namespaces OR tokens) to plain
// namespace strings and discriminate list vs map at runtime.

describe("getNamespace — handle normalization", () => {
  it("returns a string handle unchanged", () => {
    expect(getNamespace("b/config")).toBe("b/config");
  });

  it("unwraps a token to its namespace", () => {
    const token = createToken("b/config");
    expect(getNamespace(token)).toBe("b/config");
  });
});

describe("isNamespaceList", () => {
  it("is true for an array (list mode)", () => {
    expect(isNamespaceList(["a", "b"] as never)).toBe(true);
    expect(isNamespaceList([] as never)).toBe(true);
  });

  it("is false for an object (map mode)", () => {
    expect(isNamespaceList({ a: "x" } as never)).toBe(false);
  });
});

describe("getNamespaceList / getNamespaceMap", () => {
  it("getNamespaceList maps a mix of strings and tokens to namespace strings (order preserved)", () => {
    const list = ["b/a", createToken("b/b"), "b/c"] as never;
    expect(getNamespaceList(list)).toEqual(["b/a", "b/b", "b/c"]);
  });

  it("getNamespaceMap maps each handle value to its namespace, keeping keys", () => {
    const map = { cfg: "b/config", svc: createToken("b/svc") } as never;
    expect(getNamespaceMap(map)).toEqual({ cfg: "b/config", svc: "b/svc" });
  });
});

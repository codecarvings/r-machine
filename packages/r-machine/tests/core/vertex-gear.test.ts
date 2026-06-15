import { describe, expect, it } from "vitest";
import type { AnyRes } from "../../src/core/res.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import {
  buildVertexKey,
  setVertexGearTag,
  tryGetVertexGearTag,
  type VertexGearTagData,
} from "../../src/core/vertex-gear.js";

describe("buildVertexKey", () => {
  it("composes the genId and occurrenceTag into a unit-separated key", () => {
    expect(buildVertexKey(3, "0")).toBe("3\x1f0");
    expect(buildVertexKey(12, "cartA")).toBe("12\x1fcartA");
  });

  it("distinguishes occurrences within the same genId and across genIds", () => {
    expect(buildVertexKey(1, "0")).not.toBe(buildVertexKey(1, "1"));
    expect(buildVertexKey(1, "0")).not.toBe(buildVertexKey(2, "0"));
  });
});

describe("vertex gear tag round-trip", () => {
  const tag: VertexGearTagData = { namespace: "vertex/cart" as AnyNamespace, genId: 5, occurrenceTag: "0" };

  it("tryGetVertexGearTag returns undefined for an untagged resource", () => {
    expect(tryGetVertexGearTag({ count: 1 } as AnyRes)).toBeUndefined();
  });

  it("setVertexGearTag attaches a tag retrievable by tryGetVertexGearTag", () => {
    const res = { count: 1 } as AnyRes;
    setVertexGearTag(res, tag);
    expect(tryGetVertexGearTag(res)).toEqual(tag);
  });

  it("stores the tag under a symbol key (invisible to string-key enumeration)", () => {
    const res = { count: 1 } as AnyRes;
    setVertexGearTag(res, tag);
    expect(Object.keys(res)).toEqual(["count"]);
  });
});

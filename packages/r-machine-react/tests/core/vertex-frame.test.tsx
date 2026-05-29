import { cleanup, render } from "@testing-library/react";
import { buildVertexKey, type VertexGearMap, type VertexGearTagData } from "r-machine/core";
import { afterEach, describe, expect, it } from "vitest";
// `setVertexGearTag` is not part of the core public barrel; reach the source
// module directly (same file the barrel's `tryGetVertexGearTag` lives in, so
// the tag symbol identity matches what VertexFrame reads at runtime).
import { setVertexGearTag } from "../../../r-machine/src/core/vertex-gear.js";
import { useVertexFrame, VertexFrame } from "../../src/core/vertex-frame.js";

afterEach(cleanup);

// A minimal stand-in for an AnyClientGearSurface carrying a vertex tag.
function taggedGear(namespace: string, genId: number, occurrenceTag = "0") {
  const surface = {} as Record<string, unknown>;
  setVertexGearTag(surface, { namespace, genId, occurrenceTag } as VertexGearTagData);
  return surface as never;
}

// Renders a probe inside the given tree and returns whatever useVertexFrame saw.
function captureVgm(ui: (probe: React.ReactNode) => React.ReactElement): VertexGearMap | undefined {
  let captured: VertexGearMap | undefined;
  function Probe() {
    captured = useVertexFrame();
    return null;
  }
  render(ui(<Probe />));
  return captured;
}

describe("useVertexFrame", () => {
  it("returns undefined when rendered outside any VertexFrame", () => {
    let captured: VertexGearMap | undefined = { sentinel: "x" } as never;
    function Probe() {
      captured = useVertexFrame();
      return null;
    }
    render(<Probe />);
    expect(captured).toBeUndefined();
  });
});

describe("VertexFrame — single gear", () => {
  it("maps the gear's namespace to its composite vertex key", () => {
    const vgm = captureVgm((probe) => <VertexFrame gear={taggedGear("vertex/cart", 3)}>{probe}</VertexFrame>);
    expect(vgm).toEqual({ "vertex/cart": buildVertexKey(3, "0") });
  });

  it("carries the occurrenceTag into the composite key", () => {
    const vgm = captureVgm((probe) => <VertexFrame gear={taggedGear("vertex/cart", 7, "k")}>{probe}</VertexFrame>);
    expect(vgm).toEqual({ "vertex/cart": buildVertexKey(7, "k") });
  });

  it("provides an empty map when the gear carries no vertex tag", () => {
    const vgm = captureVgm((probe) => <VertexFrame gear={{} as never}>{probe}</VertexFrame>);
    expect(vgm).toEqual({});
  });
});

describe("VertexFrame — gear array", () => {
  it("merges every tagged gear's namespace into one map", () => {
    const vgm = captureVgm((probe) => (
      <VertexFrame gear={[taggedGear("vertex/a", 1), taggedGear("vertex/b", 2)]}>{probe}</VertexFrame>
    ));
    expect(vgm).toEqual({
      "vertex/a": buildVertexKey(1, "0"),
      "vertex/b": buildVertexKey(2, "0"),
    });
  });
});

describe("VertexFrame — nesting", () => {
  it("a child frame's map includes the parent frame's entries", () => {
    const vgm = captureVgm((probe) => (
      <VertexFrame gear={taggedGear("vertex/cart", 1)}>
        <VertexFrame gear={taggedGear("vertex/list", 2)}>{probe}</VertexFrame>
      </VertexFrame>
    ));
    expect(vgm).toEqual({
      "vertex/cart": buildVertexKey(1, "0"),
      "vertex/list": buildVertexKey(2, "0"),
    });
  });

  it("a child frame with an untagged gear still inherits the parent map", () => {
    const vgm = captureVgm((probe) => (
      <VertexFrame gear={taggedGear("vertex/cart", 1)}>
        <VertexFrame gear={{} as never}>{probe}</VertexFrame>
      </VertexFrame>
    ));
    expect(vgm).toEqual({ "vertex/cart": buildVertexKey(1, "0") });
  });
});

import { describe, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as probeConsumer } from "../fixtures/mock-plug/probe-consumer.js";

// A dep-surface override is a `DeepPartial`: a nested sub-key can be mocked on
// its own, siblings inherited from the real surface (runtime: mergeLiveOverride).
// `outer/probe`'s `view` is `{ a: number; b: number }`.
describe("mockPlug — DeepPartial dep override (type-level)", () => {
  it("accepts a partial sub-tree — only `view.b`, `view.a` omitted", () => {
    mockPlug(probeConsumer).with({ probe: { view: { b: 100 } } });
  });

  it("accepts a live getter yielding a partial sub-tree", () => {
    mockPlug(probeConsumer).with({
      probe: {
        get view() {
          return { b: 100 };
        },
      },
    });
  });

  it("rejects an unknown key inside the partial (still shape-checked)", () => {
    // @ts-expect-error — `nope` is not a member of `view`.
    mockPlug(probeConsumer).with({ probe: { view: { nope: 1 } } });
  });
});

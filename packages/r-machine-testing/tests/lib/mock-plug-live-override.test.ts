import { describe, expect, it } from "vitest";
import { mockPlug } from "../../src/lib/mock-plug.js";
import { r as probeConsumer } from "../fixtures/mock-plug/probe-consumer.js";

// A mocked dep getter is a `DeepPartial` deep-merged over the REAL surface, and
// it stays LIVE: mock a sub-key, drive the dep's state, and the un-mocked keys
// keep tracking. This is the merge law of `mergeLiveOverride` — the same
// `deepPartialMerge` that governs actions and `ctrl.state`.
//
// `outer/probe`'s getter is `view → { a: <state.n>, b: 2 }`. The atlas declares
// only the dep's SURFACE (not its state), so — like the other dep suites — the
// state handle is reached by casting the whole controller.
type WithProbe = { deps: { probe: { state: { n: number } } } };

describe("mergeLiveOverride — a mocked dep getter stays live w.r.t. state", () => {
  it("Sol.1 (value partial): mock `b`; `a` keeps tracking the dep's state", async () => {
    using ctrl = mockPlug(probeConsumer).with({ probe: { view: { b: 100 } } });
    const { deps } = ctrl as unknown as WithProbe;

    const inst = await ctrl.createRes();
    expect(inst.probeView).toEqual({ a: 0, b: 100 }); // real a=0, mocked b

    deps.probe.state = { n: 2 };
    expect(inst.probeView).toEqual({ a: 2, b: 100 }); // a tracks state, b stays mocked
  });

  it("Sol.2 (getter partial): a live override getter is a partial, not a replacement", async () => {
    let b = 101;
    using ctrl = mockPlug(probeConsumer).with({
      probe: {
        get view() {
          return { b };
        },
      },
    });
    const { deps } = ctrl as unknown as WithProbe;

    const inst = await ctrl.createRes();
    expect(inst.probeView).toEqual({ a: 0, b: 101 }); // `a` inherited from the real getter

    deps.probe.state = { n: 2 };
    b = 202;
    expect(inst.probeView).toEqual({ a: 2, b: 202 }); // a tracks state, b re-read live
  });
});

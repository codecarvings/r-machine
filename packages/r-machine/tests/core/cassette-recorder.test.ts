import { describe, expect, it } from "vitest";
import { createCassetteRecorder, type ReadableCell } from "../../src/core/cassette-recorder.js";

// --- helpers -----------------------------------------------------------------

function makeFakeCell(): ReadableCell {
  return {
    subscribe: () => () => {},
    subscribeInternal: () => () => {},
  };
}

// --- tests -------------------------------------------------------------------

describe("createCassetteRecorder + Cassette", () => {
  it("records reads while inserted and stops after eject", () => {
    const recorder = createCassetteRecorder();
    const cell = makeFakeCell();
    const cassette = recorder.createCassette();
    cassette.insert();
    recorder.recordRead(cell);
    expect(cassette.getDeps()).toContain(cell);
    cassette.eject();

    const other = makeFakeCell();
    recorder.recordRead(other);
    expect(cassette.getDeps()).not.toContain(other);
  });

  it("records into the topmost cassette only (innermost scope wins)", () => {
    const recorder = createCassetteRecorder();
    const cell = makeFakeCell();
    const a = recorder.createCassette();
    const b = recorder.createCassette();
    a.insert();
    b.insert();
    // b was inserted last → it's the topmost. Only b records.
    recorder.recordRead(cell);
    a.eject();
    b.eject();

    expect(a.getDeps()).not.toContain(cell);
    expect(b.getDeps()).toContain(cell);
  });

  it("after the top cassette ejects, the next-most-recent becomes the top", () => {
    const recorder = createCassetteRecorder();
    const cell1 = makeFakeCell();
    const cell2 = makeFakeCell();
    const a = recorder.createCassette();
    const b = recorder.createCassette();
    a.insert();
    b.insert();

    recorder.recordRead(cell1);
    b.eject(); // a is now the top

    recorder.recordRead(cell2);
    a.eject();

    expect(b.getDeps()).toContain(cell1);
    expect(b.getDeps()).not.toContain(cell2);
    expect(a.getDeps()).not.toContain(cell1);
    expect(a.getDeps()).toContain(cell2);
  });

  it("eject is idempotent", () => {
    const recorder = createCassetteRecorder();
    const cell = makeFakeCell();
    const cassette = recorder.createCassette();
    cassette.insert();
    cassette.eject();
    cassette.eject();
    recorder.recordRead(cell);
    expect(cassette.getDeps()).not.toContain(cell);
  });

  it("insert is idempotent and clears prior deps (reset semantics)", () => {
    const recorder = createCassetteRecorder();
    const cell1 = makeFakeCell();
    const cell2 = makeFakeCell();
    const cassette = recorder.createCassette();

    cassette.insert();
    recorder.recordRead(cell1);
    expect(cassette.getDeps()).toContain(cell1);

    // Re-insert without eject: should clear prior deps; cassette remains active.
    cassette.insert();
    expect(cassette.getDeps()).not.toContain(cell1);
    recorder.recordRead(cell2);
    expect(cassette.getDeps()).toContain(cell2);

    cassette.eject();
  });

  it("getDeps remains readable after eject (until the next insert clears)", () => {
    const recorder = createCassetteRecorder();
    const cell = makeFakeCell();
    const cassette = recorder.createCassette();
    cassette.insert();
    recorder.recordRead(cell);
    cassette.eject();

    // Deps preserved for commit-time consumers.
    expect(cassette.getDeps()).toContain(cell);

    cassette.insert();
    expect(cassette.getDeps()).not.toContain(cell);
    cassette.eject();
  });

  it("a cassette can be inserted, ejected, and re-inserted across many passes", () => {
    const recorder = createCassetteRecorder();
    const cell1 = makeFakeCell();
    const cell2 = makeFakeCell();
    const cassette = recorder.createCassette();

    cassette.insert();
    recorder.recordRead(cell1);
    cassette.eject();
    expect(cassette.getDeps()).toContain(cell1);

    cassette.insert();
    expect(cassette.getDeps()).not.toContain(cell1);
    recorder.recordRead(cell2);
    cassette.eject();
    expect(cassette.getDeps()).toContain(cell2);
    expect(cassette.getDeps()).not.toContain(cell1);
  });

  it("two recorders are independent: a cassette from one is not affected by reads via the other", () => {
    const recorderA = createCassetteRecorder();
    const recorderB = createCassetteRecorder();
    const cell = makeFakeCell();

    const cassetteA = recorderA.createCassette();
    const cassetteB = recorderB.createCassette();
    cassetteA.insert();
    cassetteB.insert();

    // recordRead on A goes to A's top only.
    recorderA.recordRead(cell);
    expect(cassetteA.getDeps()).toContain(cell);
    expect(cassetteB.getDeps()).not.toContain(cell);

    cassetteA.eject();
    cassetteB.eject();
  });

  it("two recorders are independent: a silent zone on one does not suppress reads on the other", () => {
    const recorderA = createCassetteRecorder();
    const recorderB = createCassetteRecorder();
    const cell = makeFakeCell();

    const cassetteA = recorderA.createCassette();
    cassetteA.insert();

    // Push a silent zone on recorder B. recorderA's reads must still record.
    recorderB.pushSilent();
    recorderA.recordRead(cell);
    recorderB.popSilent();

    expect(cassetteA.getDeps()).toContain(cell);
    cassetteA.eject();
  });
});

describe("silent zone", () => {
  it("suppresses recording on every active cassette of the same recorder while a silent zone is active", () => {
    const recorder = createCassetteRecorder();
    const cell = makeFakeCell();
    const outer = recorder.createCassette();
    outer.insert();
    const result = recorder.withSilentZone(() => {
      recorder.recordRead(cell);
      return 42;
    });
    outer.eject();

    expect(result).toBe(42);
    expect(outer.getDeps()).not.toContain(cell);
  });

  it("stacks: nested silent zones keep suppression while at least one is active", () => {
    const recorder = createCassetteRecorder();
    const cell = makeFakeCell();
    const outer = recorder.createCassette();
    outer.insert();
    recorder.withSilentZone(() => {
      recorder.withSilentZone(() => {
        recorder.recordRead(cell);
      });
      recorder.recordRead(cell);
    });
    outer.eject();
    expect(outer.getDeps()).not.toContain(cell);
  });
});

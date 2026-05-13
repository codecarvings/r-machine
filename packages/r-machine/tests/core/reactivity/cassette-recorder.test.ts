import { describe, expect, it } from "vitest";
import {
  insertCassette,
  type ReadableCell,
  recordRead,
  withSilentZone,
} from "../../../src/core/reactivity/cassette-recorder.js";

// --- helpers -----------------------------------------------------------------

function makeFakeCell(): ReadableCell {
  return {
    subscribe: () => () => {},
  };
}

// --- tests -------------------------------------------------------------------

describe("insertCassette + recordRead", () => {
  it("records reads while open and stops after close", () => {
    const cell = makeFakeCell();
    const handle = insertCassette();
    recordRead(cell);
    expect(handle.cassette.getDeps()).toContain(cell);
    handle.eject();

    const other = makeFakeCell();
    recordRead(other);
    expect(handle.cassette.getDeps()).not.toContain(other);
  });

  it("fans out a single read to every active cassette", () => {
    const cell = makeFakeCell();
    const a = insertCassette();
    const b = insertCassette();
    recordRead(cell);
    a.eject();
    b.eject();

    expect(a.cassette.getDeps()).toContain(cell);
    expect(b.cassette.getDeps()).toContain(cell);
  });

  it("assigns a unique id to each cassette", () => {
    const a = insertCassette();
    const b = insertCassette();
    expect(a.cassette.id).not.toBe(b.cassette.id);
    a.eject();
    b.eject();
  });

  it("is idempotent on close()", () => {
    const cell = makeFakeCell();
    const handle = insertCassette();
    handle.eject();
    handle.eject();
    recordRead(cell);
    expect(handle.cassette.getDeps()).not.toContain(cell);
  });
});

describe("silent zone", () => {
  it("suppresses recording for the silent cassette but not for outer ones", () => {
    const cell = makeFakeCell();
    const outer = insertCassette();
    const result = withSilentZone(() => {
      recordRead(cell);
      return 42;
    });
    outer.eject();

    expect(result).toBe(42);
    expect(outer.cassette.getDeps()).not.toContain(cell);
  });

  it("stacks: nested silent zones keep suppression while at least one is active", () => {
    const cell = makeFakeCell();
    const outer = insertCassette();
    withSilentZone(() => {
      withSilentZone(() => {
        recordRead(cell);
      });
      recordRead(cell);
    });
    outer.eject();
    expect(outer.cassette.getDeps()).not.toContain(cell);
  });
});

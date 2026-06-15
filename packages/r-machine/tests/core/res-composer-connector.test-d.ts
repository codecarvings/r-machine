import { describe, expectTypeOf, it } from "vitest";
import type { ResComposerConnector, ResWire } from "../../src/core/res-composer-connector.js";

// Pure-type file — type test only.
describe("ResComposerConnector", () => {
  it("requires only getWire — getWireSync and machine are optional", () => {
    // Compiles only if the sync sibling and machine handle are optional, which
    // they must be for bare composer unit tests assembled outside an RMachine.
    const minimal = { getWire: async () => ({ plugin: undefined }) } satisfies ResComposerConnector;
    expectTypeOf(minimal).toExtend<ResComposerConnector>();
  });

  it("getWire resolves to a ResWire carrying an unknown plugin", () => {
    expectTypeOf<Awaited<ReturnType<ResComposerConnector["getWire"]>>>().toEqualTypeOf<ResWire>();
    expectTypeOf<ResWire>().toEqualTypeOf<{ readonly plugin: unknown }>();
  });
});

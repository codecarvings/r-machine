import { afterEach, describe, expect, it } from "vitest";
import { disposeResources } from "../../src/lib/dispose-resources.js";
import { r as consumer } from "../fixtures/mock-plug/shared-consumer.js";

// Every case wipes the shared RMachine state so the cached `outer/shared` cell
// can't bleed between tests.
afterEach(() => disposeResources(consumer.plug));

describe("disposeResources (cross-test isolation)", () => {
  it("clears a cached stateful dependency so the next resolve starts fresh", async () => {
    const a = await consumer.create();
    expect(a.sharedValue()).toBe(0);
    a.bumpShared();
    a.bumpShared();
    expect(a.sharedValue()).toBe(2);

    disposeResources(consumer.plug);

    const b = await consumer.create();
    expect(b.sharedValue()).toBe(0); // dep re-resolved with a fresh cell
  });

  it("without disposeResources, the cached dependency state leaks (the hazard it solves)", async () => {
    const a = await consumer.create();
    expect(a.sharedValue()).toBe(0);
    a.bumpShared();

    // No reset between resolves → same cached `outer/shared` slot and cell.
    const b = await consumer.create();
    expect(b.sharedValue()).toBe(1);
  });
});

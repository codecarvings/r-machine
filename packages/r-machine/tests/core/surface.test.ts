import { describe, expect, it } from "vitest";
import { createAction } from "../../src/core/action.js";
import { createGetter } from "../../src/core/getter.js";
import { createRelay } from "../../src/core/relay.js";
import type { AnyRes } from "../../src/core/res.js";
import { buildResPod } from "../../src/core/res-pod.js";
import { tryGetVertexGearTag } from "../../src/core/vertex-gear.js";

// The runtime Surface is produced by `buildSurface` (via buildResPod) — these
// are the consumer-facing projections of a resource.

function surfaceOf(res: AnyRes) {
  return buildResPod(res, undefined).surface;
}

describe("Surface projection — member filtering", () => {
  it("strips `$`-prefixed string keys", () => {
    const res = { visible: 1, $hidden: 2, $watch: createRelay({ select: () => 1, onChange: () => {} }) } as AnyRes;
    const surface = surfaceOf(res) as Record<string, unknown>;

    expect(surface.visible).toBe(1);
    expect("$hidden" in surface).toBe(false);
    expect("$watch" in surface).toBe(false);
  });

  it("excludes Relay entries (wiring, not values)", () => {
    const res = { name: "x", onTick: createRelay({ select: () => 1, onChange: () => {} }) } as AnyRes;
    const surface = surfaceOf(res) as Record<string, unknown>;

    expect(surface.name).toBe("x");
    expect("onTick" in surface).toBe(false);
  });

  it("strips symbol keys (including Symbol.dispose)", () => {
    const res = { keep: 1, [Symbol.dispose]: () => {}, [Symbol("x")]: 9 } as unknown as AnyRes;
    const surface = surfaceOf(res);

    expect((surface as Record<string, unknown>).keep).toBe(1);
    expect(Object.getOwnPropertySymbols(surface)).toHaveLength(0);
    expect((surface as { [Symbol.dispose]?: unknown })[Symbol.dispose]).toBeUndefined();
  });
});

describe("Surface projection — member lifting", () => {
  it("lifts a Getter to a live computed property", () => {
    let n = 10;
    const res = { count: createGetter(() => n, "count") } as AnyRes;
    const surface = surfaceOf(res) as { count: number };

    expect(surface.count).toBe(10);
    n = 20;
    expect(surface.count).toBe(20); // reads through on each access
  });

  it("lifts a plain `get` accessor to a live property (re-read on each access)", () => {
    // A gear member written as a bare `get foo()` — e.g. backed by a port —
    // must stay live, NOT be read-and-frozen at surface build. Inspecting the
    // descriptor (not reading the value) is what preserves it.
    let n = 1;
    const res = {
      get foo() {
        return { a: n };
      },
    } as unknown as AnyRes;
    const surface = surfaceOf(res) as { foo: { a: number } };

    expect(surface.foo).toEqual({ a: 1 });
    n = 2;
    expect(surface.foo).toEqual({ a: 2 }); // fresh on each read, not a build-time snapshot
    expect(Object.getOwnPropertyDescriptor(surface, "foo")?.get).toBeTypeOf("function");
  });

  it("preserves an Action as a callable value", () => {
    const fn = createAction((a: number, b: number) => ({ sum: a + b }), "add");
    const res = { add: fn } as AnyRes;
    const surface = surfaceOf(res) as { add: (a: number, b: number) => { sum: number } };

    expect(typeof surface.add).toBe("function");
    expect(surface.add(2, 3)).toEqual({ sum: 5 });
  });

  it("preserves plain values as read-only own properties", () => {
    const res = { label: "hello", nested: { a: 1 } } as AnyRes;
    const surface = surfaceOf(res) as { label: string };

    expect(surface.label).toBe("hello");
    expect(Object.getOwnPropertyDescriptor(surface, "label")).toMatchObject({
      enumerable: true,
      configurable: false,
      writable: false,
    });
  });
});

describe("Surface projection — vertex tag", () => {
  it("applies a vertex tag onto the surface when provided", () => {
    const tag = { namespace: "vertex/cart" as never, genId: 3, occurrenceTag: "0" };
    const surface = buildResPod({ count: 1 } as AnyRes, tag).surface;

    expect(tryGetVertexGearTag(surface as AnyRes)).toEqual(tag);
  });

  it("buildResPod pairs the resource with its projected surface", () => {
    const pod = buildResPod({ value: 1 } as AnyRes, undefined);

    expect(pod.res).toEqual({ value: 1 });
    expect((pod.surface as { value: number }).value).toBe(1);
  });
});

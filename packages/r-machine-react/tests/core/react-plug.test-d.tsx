import type { AnyResAtlas } from "r-machine/core";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactPlugDefiner, ReactPlugKitMap } from "../../src/core/react-plug.js";

// Concrete atlas exercising the consumer-side `valid@client` catalog: client
// Plugs may consume base / outer / outer(vertex) / shell, but NOT inner gears.
type SvcShape = { now: () => number };
type StateShape = { count: number };
type CopyShape = { hello: string };
type CartShape = { items: number };

interface TestAtlas extends AnyResAtlas {
  readonly shape: {
    "i/cfg": { apiBase: string };
    "b/svc": SvcShape;
    "g/state": StateShape;
    "s/copy": CopyShape;
    "vertex/cart": CartShape;
  };
  readonly let: {
    "i/cfg": "gear:inner";
    "b/svc": "gear:base";
    "g/state": "gear:outer";
    "s/copy": "shell";
    "vertex/cart": "gear:outer(vertex)";
  };
  // What a client Plug may consume.
  readonly "valid@client": {
    "b/svc": SvcShape;
    "g/state": StateShape;
    "s/copy": CopyShape;
    "vertex/cart": CartShape;
  };
  // What may be injected as consumer kit.
  readonly "valid@client:kit": { "b/svc": SvcShape; "s/copy": CopyShape };
}

declare const Plug: ReactPlugDefiner<TestAtlas, "en", {}>;

describe("ReactPlugDefiner — dep-graph (client consumption rules)", () => {
  it("accepts base / outer / shell / vertex namespaces", () => {
    Plug("b/svc");
    Plug("g/state");
    Plug("s/copy");
    Plug("vertex/cart");
    Plug({ svc: "b/svc", copy: "s/copy" });
  });

  it("rejects inner gears (server-only — not consumable from a client Plug)", () => {
    // @ts-expect-error — inner gears are not consumable via a client Plug
    Plug("i/cfg");
    // @ts-expect-error — same in map form
    Plug({ cfg: "i/cfg" });
  });
});

describe("ReactPlugDefiner — useR() surface shape", () => {
  it("no-arg form → map plugin carrying `$`", () => {
    const r = Plug().useR();
    expectTypeOf(r).toHaveProperty("$");
  });

  it("list form → positional tuple of resolved surfaces", () => {
    const r = Plug("g/state").useR();
    expectTypeOf(r[0].count).toEqualTypeOf<number>();
  });

  it("map form → named resolved surfaces plus `$`", () => {
    const r = Plug({ copy: "s/copy" }).useR();
    expectTypeOf(r.copy.hello).toEqualTypeOf<string>();
    expectTypeOf(r).toHaveProperty("$");
  });
});

describe("ReactPlugKitMap", () => {
  it("is keyed over the `valid@client:kit` namespaces", () => {
    type KM = ReactPlugKitMap<TestAtlas>;
    // A namespace map: arbitrary string keys → client-kit-eligible namespaces.
    expectTypeOf<KM[string]>().toEqualTypeOf<"b/svc" | "s/copy">();
  });
});

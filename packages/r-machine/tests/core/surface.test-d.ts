import { describe, expectTypeOf, it } from "vitest";
import type { Action } from "../../src/core/action.js";
import type { Getter } from "../../src/core/getter.js";
import type { Relay } from "../../src/core/relay.js";
import type { Surface } from "../../src/core/surface.js";

type SampleRes = {
  label: string;
  count: Getter<number>;
  add: Action<(n: number) => { x: number }>;
  onTick: Relay<number>;
  $secret: number;
  $watch: Relay<number>;
};

type S = Surface<SampleRes, "g/x", "gear:outer">;

describe("Surface<R, N, LET> — member projection", () => {
  it("preserves plain values", () => {
    expectTypeOf<S["label"]>().toEqualTypeOf<string>();
  });

  it("lifts Getter<V> to V", () => {
    expectTypeOf<S["count"]>().toEqualTypeOf<number>();
  });

  it("projects Action<F> to a void-returning function with F's parameters", () => {
    expectTypeOf<S["add"]>().toEqualTypeOf<(n: number) => void>();
  });

  it("collapses non-$ Relay members to never", () => {
    expectTypeOf<S["onTick"]>().toEqualTypeOf<never>();
  });

  it("drops `$`-prefixed keys from the surface", () => {
    type HasSecret = "$secret" extends keyof S ? true : false;
    type HasWatch = "$watch" extends keyof S ? true : false;
    expectTypeOf<HasSecret>().toEqualTypeOf<false>();
    expectTypeOf<HasWatch>().toEqualTypeOf<false>();
  });
});

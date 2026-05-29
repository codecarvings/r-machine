import { describe, expectTypeOf, it } from "vitest";
import type { BaseGearComposer } from "../../src/core/base-gear-composer.js";
import type { InnerGearComposer } from "../../src/core/inner-gear-composer.js";
import type { OuterGearComposer } from "../../src/core/outer-gear-composer.js";
import type { AnyResAtlas } from "../../src/core/res-atlas.js";

// A concrete atlas wired with four namespaces across the families. The composer
// dep types read the `valid@*` sub-maps to enforce the dep-graph asymmetry
// (§8 of the docs); `shape`/`let` drive the resolved Surface shapes.
type CfgShape = { apiBase: string };
type SvcShape = { now: () => number };
type StateShape = { count: number };
type CopyShape = { hello: string };

interface TestAtlas extends AnyResAtlas {
  readonly shape: {
    "i/cfg": CfgShape;
    "b/svc": SvcShape;
    "g/state": StateShape;
    "s/copy": CopyShape;
  };
  readonly let: {
    "i/cfg": "gear:inner";
    "b/svc": "gear:base";
    "g/state": "gear:outer";
    "s/copy": "shell";
  };
  // inner gears may depend on inner + base only.
  readonly "valid@gear:inner": { "i/cfg": CfgShape; "b/svc": SvcShape };
  // outer gears may depend on base + outer only.
  readonly "valid@gear:outer": { "b/svc": SvcShape; "g/state": StateShape };
}

declare const innerComposer: InnerGearComposer<TestAtlas, {}>;
declare const baseComposer: BaseGearComposer<TestAtlas, {}>;
declare const outerComposer: OuterGearComposer<TestAtlas, {}>;

describe("withDeps — dep-graph asymmetry (compile-time enforcement)", () => {
  it("inner gears accept inner / base deps", () => {
    innerComposer.withDeps("i/cfg");
    innerComposer.withDeps("b/svc");
    innerComposer.withDeps({ cfg: "i/cfg", svc: "b/svc" });
  });

  it("inner gears reject outer / shell deps", () => {
    // @ts-expect-error — outer gear is not a valid inner-gear dependency
    innerComposer.withDeps("g/state");
    // @ts-expect-error — shell is not a valid inner-gear dependency
    innerComposer.withDeps("s/copy");
  });

  it("outer gears accept base / outer deps but reject inner / shell deps", () => {
    outerComposer.withDeps("b/svc");
    outerComposer.withDeps("g/state");
    // @ts-expect-error — inner gear is not a valid outer-gear dependency
    outerComposer.withDeps("i/cfg");
    // @ts-expect-error — shell is not a valid outer-gear dependency
    outerComposer.withDeps("s/copy");
  });
});

describe("withDeps — plugin shape (list vs map)", () => {
  it("list form → factory receives a positional tuple `[...surfaces, $]`", () => {
    innerComposer.withDeps("i/cfg").define((plugin) => {
      // First element is the resolved Surface of the dep; trailing element is `$`.
      expectTypeOf(plugin[0].apiBase).toEqualTypeOf<string>();
      expectTypeOf(plugin).toBeArray();
      return {};
    });
  });

  it("map form → factory receives named surfaces plus `$`", () => {
    innerComposer.withDeps({ cfg: "i/cfg" }).define((plugin) => {
      expectTypeOf(plugin.cfg.apiBase).toEqualTypeOf<string>();
      expectTypeOf(plugin).toHaveProperty("$");
      return {};
    });
  });

  it("base gear map deps resolve surfaces too", () => {
    baseComposer.withDeps({ svc: "b/svc" }).define((plugin) => {
      expectTypeOf(plugin.svc.now).toEqualTypeOf<() => number>();
      return {};
    });
  });
});

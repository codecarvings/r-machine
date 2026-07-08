import { describe, expectTypeOf, it } from "vitest";
import type { BaseGearComposer } from "../../src/core/base-gear-composer.js";
import type { InnerGearComposer } from "../../src/core/inner-gear-composer.js";
import type { OuterGearComposer } from "../../src/core/outer-gear-composer.js";
import type { AnyResAtlas } from "../../src/core/res-atlas.js";
import type { ShellResolverBuilder } from "../../src/core/res-domain.js";
import type { ShellComposer } from "../../src/core/shell-composer.js";

// The atlas's configured locale union — what `res.perLocale`'s loader param is
// typed to (NOT the wide `AnyLocale`), so an invalid locale is a compile error.
type Locale = "en" | "it";

// Concrete atlas exercising `shellResolver`. `shape@shell` is what restricts a shell resolver
// to SHELLS only (gears are rejected), mirroring how `withDeps` reads `valid@*`.
type CfgShape = { apiBase: string };
type GreetShape = { text: string; subject: string };

interface TestAtlas extends AnyResAtlas {
  readonly shape: {
    "i/cfg": CfgShape;
    "s/greet": GreetShape;
  };
  readonly let: {
    "i/cfg": "gear:inner";
    "s/greet": "shell";
  };
  readonly "shape@shell": { "s/greet": GreetShape };
  readonly "valid@gear:inner": { "i/cfg": CfgShape };
  readonly "valid@gear:outer": { "i/cfg": CfgShape };
  readonly "shape@gear:base": {};
}

declare const innerComposer: InnerGearComposer<TestAtlas, {}>;
declare const baseComposer: BaseGearComposer<TestAtlas, {}>;
declare const outerComposer: OuterGearComposer<TestAtlas, {}>;
declare const shellComposer: ShellComposer<TestAtlas, Locale, [], {}>;

// The shell resolver builder as exposed on the toolset (`toolset.res.perLocale`) —
// restricted to the atlas's shell catalog, carrying the configured locale `L`.
declare const shellResolver: ShellResolverBuilder<TestAtlas["shape@shell"], Locale>;

describe("shellResolver — restricted to the shell catalog", () => {
  it("accepts a shell namespace inside withDeps (all gear families)", () => {
    innerComposer.withDeps({ greet: shellResolver("s/greet") });
    baseComposer.withDeps({ greet: shellResolver("s/greet") });
    outerComposer.withDeps({ greet: shellResolver("s/greet") });
  });

  it("rejects a non-shell (gear) namespace passed to shellResolver itself", () => {
    // @ts-expect-error — a gear namespace is not a valid shellResolver target
    innerComposer.withDeps({ bad: shellResolver("i/cfg") });
  });
});

describe("resolved type of a shell resolver dep", () => {
  it("is a locale-parametric loader returning the shell surface", () => {
    innerComposer.withDeps({ greet: shellResolver("s/greet") }).define((plugin) => {
      expectTypeOf(plugin.greet).toBeFunction();
      expectTypeOf(plugin.greet).parameter(0).toEqualTypeOf<Locale>();
      plugin.greet("en"); // a configured locale is accepted
      // @ts-expect-error — "de" is not a configured locale of this atlas
      plugin.greet("de");
      type Surface = Awaited<ReturnType<typeof plugin.greet>>;
      expectTypeOf<Surface["text"]>().toEqualTypeOf<string>();
      expectTypeOf<Surface["subject"]>().toEqualTypeOf<string>();
      return {};
    });
  });

  it("coexists with normal deps (which stay plain surfaces)", () => {
    innerComposer
      .withDeps({ cfg: "i/cfg", greet: shellResolver("s/greet") })
      .withPorts({ send: (_s: string) => 1 })
      .define((plugin) => {
        // normal dep → plain surface (fields exposed directly, NOT a function)
        expectTypeOf(plugin.cfg.apiBase).toEqualTypeOf<string>();
        expectTypeOf(plugin.cfg).not.toBeFunction();
        // shell resolver dep → loader function
        expectTypeOf(plugin.greet).toBeFunction();
        expectTypeOf(plugin.$.ports.send).toBeFunction();
        return {};
      });
  });
});

describe("shellResolver — list (positional) form", () => {
  it("resolves the loader at the shell resolver's tuple position", () => {
    innerComposer.withDeps("i/cfg", shellResolver("s/greet")).define((plugin) => {
      const [cfg, greet] = plugin;
      expectTypeOf(cfg.apiBase).toEqualTypeOf<string>();
      expectTypeOf(greet).toBeFunction();
      expectTypeOf(greet).parameter(0).toEqualTypeOf<Locale>();
      return {};
    });
  });
});

describe("res.perLocale — batch helpers (pickAll / pick)", () => {
  it("pickAll(loader) resolves Record<Locale, Surface>", () => {
    innerComposer.withDeps({ greet: shellResolver("s/greet") }).define((plugin) => {
      type S = Awaited<ReturnType<typeof plugin.greet>>;
      expectTypeOf(shellResolver.pickAll(plugin.greet)).resolves.toEqualTypeOf<Record<Locale, S>>();
      return {};
    });
  });

  it("pickAll(map) resolves Record<Locale, bundle> (locale-major)", () => {
    innerComposer.withDeps({ greet: shellResolver("s/greet") }).define((plugin) => {
      type S = Awaited<ReturnType<typeof plugin.greet>>;
      expectTypeOf(shellResolver.pickAll({ a: plugin.greet, b: plugin.greet })).resolves.toEqualTypeOf<
        Record<Locale, { a: S; b: S }>
      >();
      return {};
    });
  });

  it("pick(locale, …) resolves the bundle (map) / tuple, typed to the configured locale", () => {
    innerComposer.withDeps({ greet: shellResolver("s/greet") }).define((plugin) => {
      type S = Awaited<ReturnType<typeof plugin.greet>>;
      expectTypeOf(shellResolver.pick("en", { a: plugin.greet, b: plugin.greet })).resolves.toEqualTypeOf<{
        a: S;
        b: S;
      }>();
      expectTypeOf(shellResolver.pick("it", [plugin.greet, plugin.greet])).resolves.toEqualTypeOf<[S, S]>();
      // @ts-expect-error — "de" is not a configured locale of this atlas
      shellResolver.pick("de", { a: plugin.greet });
      return {};
    });
  });
});

describe("shellResolver — usable inside a SHELL's withDeps (cross-locale reuse)", () => {
  it("a shell can declare a shell resolver dep, resolving ANOTHER locale on demand", () => {
    shellComposer.withDeps({ other: shellResolver("s/greet") }).define((plugin) => {
      // the shell has its OWN ambient locale…
      expectTypeOf(plugin.$.locale).toEqualTypeOf<Locale>();
      // …and can pull another locale's shell surface via the loader.
      expectTypeOf(plugin.other).toBeFunction();
      expectTypeOf(plugin.other).parameter(0).toEqualTypeOf<Locale>();
      type S = Awaited<ReturnType<typeof plugin.other>>;
      expectTypeOf<S["text"]>().toEqualTypeOf<string>();
      return { text: "hi", subject: "s" };
    });
  });

  it("shell resolver coexists with a normal shell dep (same-locale surface)", () => {
    shellComposer.withDeps({ same: "s/greet", other: shellResolver("s/greet") }).define((plugin) => {
      // normal dep → resolved surface in the shell's own locale (NOT a function)
      expectTypeOf(plugin.same.text).toEqualTypeOf<string>();
      expectTypeOf(plugin.same).not.toBeFunction();
      // resolver dep → locale loader
      expectTypeOf(plugin.other).toBeFunction();
      return { text: "hi", subject: "s" };
    });
  });
});

import { describe, expect, it } from "vitest";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import { createResourceLoader, type ResModuleLoaderFnOptions } from "../../src/core/res-loader.js";
import type { AnyResModule } from "../../src/core/res-module.js";
import { ERR_NO_LOADER_REGISTERED, RMachineUsageError } from "../../src/errors/index.js";

// Build the loader options the dispatcher receives from BlueprintManager.
// `pathParts` is [matched-prefix, suffix]; the `path` argument is the full path.
function makeOptions(
  prefix: string,
  suffix: string,
  namespace = `${prefix}${suffix}`,
  locale: string | undefined = undefined
): ResModuleLoaderFnOptions {
  return {
    namespace: namespace as AnyNamespace,
    namespaceParts: [prefix, suffix],
    pathParts: [prefix, suffix],
    locale,
  };
}

const mod = (tag: string): AnyResModule => ({ r: { tag } }) as unknown as AnyResModule;

describe("createResourceLoader", () => {
  it("returns an object exposing register / load", () => {
    const loader = createResourceLoader();
    expect(typeof loader.register).toBe("function");
    expect(typeof loader.load).toBe("function");
  });

  describe("register(prefixes, fn)", () => {
    it("routes by the matched layout prefix and passes the full path to the fn", async () => {
      const loader = createResourceLoader();
      let seenPath: string | undefined;
      loader.register(["shell/"], async (path) => {
        seenPath = path;
        return mod("shell");
      });

      const result = await loader.load("shell/cart/en", makeOptions("shell/", "cart/en", "shell/cart", "en"));

      expect(result).toEqual({ r: { tag: "shell" } });
      // The fn receives the FULL path (not the prefix-stripped suffix).
      expect(seenPath).toBe("shell/cart/en");
    });

    it("passes the full options through to the fn", async () => {
      const loader = createResourceLoader();
      let seen: ResModuleLoaderFnOptions | undefined;
      loader.register(["shell/"], async (_path, options) => {
        seen = options;
        return mod("shell");
      });

      const options = makeOptions("shell/", "cart/en", "shell/cart", "en");
      await loader.load("shell/cart/en", options);

      expect(seen).toBe(options);
    });

    it("registers one fn for multiple prefixes in a single call", async () => {
      const loader = createResourceLoader();
      loader.register(["base/", "outer/"], async (path) => mod(path));

      expect(await loader.load("base/cfg", makeOptions("base/", "cfg"))).toEqual({ r: { tag: "base/cfg" } });
      expect(await loader.load("outer/cart", makeOptions("outer/", "cart"))).toEqual({ r: { tag: "outer/cart" } });
    });

    it("accumulates across multiple register() calls", async () => {
      const loader = createResourceLoader();
      loader.register(["base/"], async () => mod("base"));
      loader.register(["shell/"], async () => mod("shell"));

      expect(await loader.load("base/cfg", makeOptions("base/", "cfg"))).toEqual({ r: { tag: "base" } });
      expect(await loader.load("shell/x", makeOptions("shell/", "x"))).toEqual({ r: { tag: "shell" } });
    });
  });

  describe('"*" catch-all', () => {
    it("handles any prefix that has no specific loader", async () => {
      const loader = createResourceLoader();
      loader.register(["*"], async (path) => mod(`default:${path}`));

      expect(await loader.load("inner/secret", makeOptions("inner/", "secret"))).toEqual({
        r: { tag: "default:inner/secret" },
      });
    });

    it("is overridden by a prefix-specific loader (specific wins)", async () => {
      const loader = createResourceLoader();
      loader.register(["*"], async () => mod("default"));
      loader.register(["shell/"], async () => mod("shell"));

      expect(await loader.load("shell/x", makeOptions("shell/", "x"))).toEqual({ r: { tag: "shell" } });
      expect(await loader.load("base/x", makeOptions("base/", "x"))).toEqual({ r: { tag: "default" } });
    });

    it("specific wins regardless of registration order", async () => {
      const loader = createResourceLoader();
      loader.register(["shell/"], async () => mod("shell"));
      loader.register(["*"], async () => mod("default"));

      expect(await loader.load("shell/x", makeOptions("shell/", "x"))).toEqual({ r: { tag: "shell" } });
    });
  });

  describe("missing loader", () => {
    it("throws RMachineUsageError(ERR_NO_LOADER_REGISTERED) when no prefix and no catch-all matches", async () => {
      const loader = createResourceLoader();
      loader.register(["base/"], async () => mod("base"));
      try {
        await loader.load("inner/secret", makeOptions("inner/", "secret"));
        expect.unreachable("load() should reject when no loader matches the prefix");
      } catch (err) {
        expect(err).toBeInstanceOf(RMachineUsageError);
        expect((err as RMachineUsageError).code).toBe(ERR_NO_LOADER_REGISTERED);
        // The message names the offending prefix so the diagnostic is actionable.
        expect((err as RMachineUsageError).message).toContain('"inner/"');
      }
    });
  });
});

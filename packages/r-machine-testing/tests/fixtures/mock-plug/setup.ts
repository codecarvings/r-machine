import { RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas.js";

// Dependency / kit modules are synthesised inline. `InnerGear` is referenced
// from the toolset destructured below; the closure only runs when a test
// instantiates a resource, by which point the binding is initialised.
ResourceAtlas.loader.register(["*"], async (path): Promise<AnyResModule> => {
  switch (path) {
    case "inner/double":
      return { r: InnerGear.define(() => ({ double: (n: number) => n * 2 })) } as unknown as AnyResModule;
    case "base/helper":
      return {
        r: BaseGear.define(() => ({
          greet: (name: string) => `hi ${name}`,
          shout: () => "AAA",
        })),
      } as unknown as AnyResModule;
    case "outer/shared":
      return {
        r: OuterGear.withState({ n: 0 }).define((plugin, _) => ({
          value: _.getter(() => plugin.$.state.n),
          inc: _.action(() => ({ n: plugin.$.state.n + 1 })),
        })),
      } as unknown as AnyResModule;
    default:
      throw new Error(`mock-plug fixture: unknown resource "${path}"`);
  }
});

const rMachine = RMachine.create({
  instanceName: "mock-plug-fixtures",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  // Machine-wide kit: `helper` is injected into every gear's `$.kit` (and
  // hoisted onto the top-level), exercised by the kit-override suite.
  gearKit: { helper: "base/helper" },
  experimental: { outerGear: "on" },
});

export const { InnerGear, BaseGear, OuterGear, DirectPlug, Shell } = rMachine.createToolset();

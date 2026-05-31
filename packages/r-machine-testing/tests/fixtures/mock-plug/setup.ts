import { RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas.js";

const rMachine = RMachine.create({
  instanceName: "mock-plug-fixtures",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  // Dependency modules are synthesised inline. `InnerGear` is referenced from
  // the toolset destructured below; the closure only runs during a test's
  // `r.create()`, by which point the binding is initialised.
  load: async (path): Promise<AnyResModule> => {
    switch (path) {
      case "inner/double":
        return { r: InnerGear.define(() => ({ double: (n: number) => n * 2 })) } as unknown as AnyResModule;
      default:
        throw new Error(`mock-plug fixture: unknown resource "${path}"`);
    }
  },
  experimental: { outerGear: "on" },
});

export const { InnerGear, OuterGear } = rMachine.createToolset();

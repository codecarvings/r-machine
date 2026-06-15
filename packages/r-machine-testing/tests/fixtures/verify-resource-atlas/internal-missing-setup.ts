import { RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas.js";

const rMachine = RMachine.create({
  instanceName: "verify-test-internal-missing",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: async (path) => {
    // The internal-namespace marker (`#`) must be stripped before the loader
    // sees the path. We expect the bare form here, never `#shell/internal/it`.
    if (path === "shell/internal/it") {
      return undefined as unknown as AnyResModule;
    }
    return { r: { resolvedFrom: path } } as AnyResModule;
  },
});

export const strategy = rMachine;

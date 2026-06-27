import { RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas.js";

ResourceAtlas.loader.register(["*"], async (path) => {
  // Simulate a missing IT translation for shell/multi.
  if (path === "shell/multi/it") {
    return undefined as unknown as AnyResModule;
  }
  return { r: { resolvedFrom: path } } as AnyResModule;
});

const rMachine = RMachine.create({
  instanceName: "verify-test-missing",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

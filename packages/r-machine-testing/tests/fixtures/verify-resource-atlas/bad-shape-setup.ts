import { RMachine } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas.js";

ResourceAtlas.loader.register(["*"], async (path) => {
  // Return a malformed module (missing `r`) for shell/lib/mono.
  if (path === "shell/lib/mono") {
    return { wrongShape: true } as unknown as AnyResModule;
  }
  return { r: { resolvedFrom: path } } as AnyResModule;
});

const rMachine = RMachine.create({
  instanceName: "verify-test-bad-shape",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

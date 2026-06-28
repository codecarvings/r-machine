import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

ResourceAtlas.loader.register(["*"], async (path) => ({ r: { resolvedFrom: path } }));

const rMachine = RMachine.create({
  instanceName: "verify-test-ok",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

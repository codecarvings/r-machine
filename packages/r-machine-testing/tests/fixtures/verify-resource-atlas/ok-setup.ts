import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

const rMachine = RMachine.create({
  instanceName: "verify-test-ok",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: async (path) => ({ r: { resolvedFrom: path } }),
});

export const strategy = rMachine;

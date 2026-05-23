import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

const rMachine = RMachine.create({
  instanceName: "verify-test-custom-export",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  load: async (path) => ({ r: { resolvedFrom: path } }),
});

// Exposed under a non-default name to exercise the `strategyExportName` option.
export const myStrategy = rMachine;

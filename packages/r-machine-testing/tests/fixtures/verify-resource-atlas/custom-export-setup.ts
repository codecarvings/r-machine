import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

ResourceAtlas.loader.register(["*"], async (path) => ({ r: { resolvedFrom: path } }));

const rMachine = RMachine.create({
  instanceName: "verify-test-custom-export",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

// Exposed under a non-default name to exercise the `strategyExportName` option.
export const myStrategy = rMachine;

import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

ResourceAtlas.loader.register(["*"], async (path) => {
  // Simulate a broken loader for gear/inner.
  if (path === "gear/inner") {
    throw new Error("synthetic loader failure");
  }
  return { r: { resolvedFrom: path } };
});

const rMachine = RMachine.create({
  instanceName: "verify-test-throws",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

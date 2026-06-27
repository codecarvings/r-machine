import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

// Drives `serializeError` through its non-`Error` and degenerate-`Error` paths:
//  - `gear/inner` throws a raw string  → { name: "UnknownError", message }.
//  - every other key throws an Error whose `name` is "" and whose `stack` was
//    deleted → exercises `err.name || "Error"` and the no-stack branch.
ResourceAtlas.loader.register(["*"], async (path: string) => {
  if (path === "gear/inner") {
    throw "raw string failure";
  }
  const e = new Error("degenerate error");
  e.name = "";
  delete e.stack;
  throw e;
});

const rMachine = RMachine.create({
  instanceName: "verify-test-serialize-variants",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

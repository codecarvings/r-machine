import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

// Simulate `@r-machine/next`'s `createNextDevImport` being invoked without
// jiti installed: the `attempted` flag is set, the `enabled` flag is NOT.
// (We mimic the contract via the registry symbols directly so the testing
// package does not need a dependency on `@r-machine/next`.)
(globalThis as Record<symbol, unknown>)[Symbol.for("@r-machine:dev-loader-attempted")] = true;

// Loader fails for every path — what would happen if jiti weren't available
// and the production `import(...)` template-literal path couldn't resolve.
ResourceAtlas.loader.register(["*"], async () => {
  throw new Error("simulated: dev loader not active");
});

const rMachine = RMachine.create({
  instanceName: "verify-test-dev-loader-missing",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

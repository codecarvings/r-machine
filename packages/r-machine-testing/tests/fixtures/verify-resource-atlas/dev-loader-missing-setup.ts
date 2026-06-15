import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

// Simulate `@r-machine/next`'s `createNextDevImport` being invoked without
// jiti installed: the `attempted` flag is set, the `enabled` flag is NOT.
// (We mimic the contract via the registry symbols directly so the testing
// package does not need a dependency on `@r-machine/next`.)
(globalThis as Record<symbol, unknown>)[Symbol.for("@r-machine:dev-loader-attempted")] = true;

const rMachine = RMachine.create({
  instanceName: "verify-test-dev-loader-missing",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
  // Loader fails for every path — what would happen if jiti weren't available
  // and the production `import(...)` template-literal path couldn't resolve.
  load: (async () => {
    throw new Error("simulated: dev loader not active");
  }) as unknown as Parameters<typeof RMachine.create>[0]["load"],
});

export const strategy = rMachine;

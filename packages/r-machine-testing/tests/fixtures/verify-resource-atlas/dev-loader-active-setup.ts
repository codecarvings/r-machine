import { RMachine } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.js";

// Simulate `@r-machine/next`'s `createNextDevImport` succeeding (jiti loaded):
// BOTH flags are set. A subsequent loader failure should NOT trigger the
// `dev-loader-not-active` hint — the hint exists to disambiguate "jiti
// missing" from "real loader bug", and this scenario is the latter.
(globalThis as Record<symbol, unknown>)[Symbol.for("@r-machine:dev-loader-attempted")] = true;
(globalThis as Record<symbol, unknown>)[Symbol.for("@r-machine:dev-loader-enabled")] = true;

ResourceAtlas.loader.register(["*"], async () => {
  throw new Error("genuine loader bug — jiti is fine");
});

const rMachine = RMachine.create({
  instanceName: "verify-test-dev-loader-active",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

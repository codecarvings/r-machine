import { RMachine } from "r-machine";
import { ResourceAtlas } from "./split-atlas.js";

// Registers ONLY the client-safe `shell/` prefix. The server-only `gear/`
// prefix is intentionally left out — it is supplied by `split-extra-loader.ts`,
// imported via the `loaders` option of verifyResourceAtlas.
ResourceAtlas.loader.register(["shell/"], async (path) => ({ r: { resolvedFrom: path } }));

const rMachine = RMachine.create({
  instanceName: "verify-test-split",
  locales: ["en", "it"],
  defaultLocale: "en",
  ResourceAtlas,
});

export const strategy = rMachine;

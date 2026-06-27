import { ResourceAtlas } from "./split-atlas.js";

// Stand-in for a server-only `prv/loader.ts`: registers the `gear/` prefix on
// the SAME ResourceAtlas.loader singleton that split-setup.ts uses. Imported
// for its side-effect via the `loaders` option of verifyResourceAtlas.
ResourceAtlas.loader.register(["gear/"], async (path) => ({ r: { resolvedFrom: path } }));

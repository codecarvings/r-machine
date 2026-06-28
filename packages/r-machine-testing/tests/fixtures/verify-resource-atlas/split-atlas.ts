import { defineLayout } from "r-machine";

// A dedicated atlas (separate defineLayout → its own loader instance, isolated
// from the shared resource-atlas.ts) used to exercise the `loaders` option:
// `split-setup.ts` registers only `shell/`, leaving `gear/` to be supplied by a
// separate loader module (`split-extra-loader.ts`) passed via `loaders`.
const folders = defineLayout({
  "gear/": "gear:inner",
  "shell/": "shell",
});

type ResourceMap = {
  "gear/inner": { factory: () => Promise<{ value: number }> };
  "shell/hello": { factory: () => Promise<{ greeting: string }> };
};

export class ResourceAtlas extends folders<ResourceMap>() {}

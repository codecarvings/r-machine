import { defineLayout } from "r-machine";

const folders = defineLayout({
  "inner/": "gear:inner",
  "outer/": "gear:outer",
});

type ResourceMap = {
  // Only resources resolved BY namespace (i.e. used as deps) need an atlas
  // entry. `outer/counter` and `inner/quad` are created directly via
  // `r.create()` in tests, so they are intentionally absent here.
  "inner/double": { double: (n: number) => number };
};

export class ResourceAtlas extends folders<ResourceMap>() {}

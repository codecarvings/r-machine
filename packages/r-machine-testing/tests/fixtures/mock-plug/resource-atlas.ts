import { defineLayout } from "r-machine";

const folders = defineLayout({
  "inner/": "gear:inner",
  "outer/": "gear:outer",
  "shell/": "shell",
});

type ResourceMap = {
  // Only resources resolved BY namespace (deps or kit) need an atlas entry.
  // `outer/counter`, `inner/quad`, `shell/greet` are created directly via
  // `r.create()` in tests, so they are intentionally absent here.
  "inner/double": { double: (n: number) => number };
  // Machine-wide gearKit entry: exercised by the kit-override suite.
  "inner/helper": { greet: (name: string) => string; shout: () => string };
  // Stateful dep used by the cross-test isolation suite: its cached state cell
  // is what `disposeResources` must clear between tests.
  "outer/shared": { value: number; inc: () => void };
};

export class ResourceAtlas extends folders<ResourceMap>() {}

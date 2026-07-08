import { defineLayout } from "r-machine";

const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "shell/": "shell",
});

type ResourceMap = {
  // Only resources resolved BY namespace (deps or kit) need an atlas entry.
  // `outer/counter`, `inner/quad`, `shell/greet` are instantiated directly via
  // `ctrl.createRes()` / `instantiateRes` in tests, so they are intentionally
  // absent here.
  "inner/double": { double: (n: number) => number };
  // Machine-wide gearKit entry: exercised by the kit-override suite.
  "base/helper": { greet: (name: string) => string; shout: () => string };
  // Stateful dep used by the cross-test isolation suite: its cached state cell
  // is what `reset` must clear between tests.
  "outer/shared": { value: number; inc: () => void };
  // Stateful dep whose getter returns an object deriving from state: the
  // live-getter mock scenario (mock a sub-key, drive state, the sibling tracks).
  "outer/probe": { view: { a: number; b: number } };
};

export class ResourceAtlas extends folders<ResourceMap>() {}

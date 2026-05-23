import { defineLayout } from "r-machine";

const folders = defineLayout({
  "gear/": "gear:inner",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "gear/inner": { factory: () => Promise<{ value: number }> };
  "shell/multi": { factory: () => Promise<{ greeting: string }> };
  "shell/lib/mono": { factory: () => Promise<{ format: () => string }> };
  // Internal-namespace marker (`#` prefix): consumer-hidden, but still part
  // of verification. The marker is stripped at runtime before resolver / loader.
  "#shell/internal": { factory: () => Promise<{ secret: string }> };
};

export class ResourceAtlas extends folders<ResourceMap>() {}

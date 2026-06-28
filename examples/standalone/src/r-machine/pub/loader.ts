import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "@/r-machine/resource-atlas.ts";

// Explicit module map — the bundler-free loader. Each entry is a LITERAL
// `import(...)` (resolved relative to this folder), so it works identically
// under plain `tsx` (the CLI), Vite (vitest), and `verifyResourceAtlas`. The map
// key is the resolved path the loader receives — already locale-suffixed for shells.
const modules: Record<string, () => Promise<AnyResModule>> = {
  "base/config": () => import("./base/config.ts"),
  "shell/greeting/en": () => import("./shell/greeting/en.ts"),
  "shell/greeting/it": () => import("./shell/greeting/it.ts"),
  "shell/lib/fmt": () => import("./shell/lib/fmt.ts"),
};

// No server boundary standalone → a single loader covers everything.
ResourceAtlas.loader.register(["*"], (path) => {
  const loader = modules[path];
  if (!loader) {
    throw new Error(`Resource module not registered: "${path}"`);
  }
  return loader();
});

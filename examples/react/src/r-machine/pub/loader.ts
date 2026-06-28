import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "@/r-machine/resource-atlas";

// Vite statically analyzes this glob (rooted at this `pub/` folder) and creates
// chunk files for all matching resource modules.
const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}", {});

const useHMR = import.meta.hot && !import.meta.env.TEST;

// No server boundary in a Vite SPA → a single loader covers everything.
ResourceAtlas.loader.register(["*"], async (path) => {
  const modulePathTsx = `./${path}.tsx`;
  const modulePathTs = `./${path}.ts`;
  const resolvedPath = moduleLoaders[modulePathTsx] ? modulePathTsx : moduleLoaders[modulePathTs] ? modulePathTs : null;

  if (!resolvedPath) {
    throw new Error(`Module not found: ${path}`);
  }

  if (useHMR) {
    // In dev, ALWAYS import with a cache-busting query so an HMR-invalidated
    // module (and its freshly-bumped transitive deps) is re-fetched.
    // Skipped under vitest: it also defines `import.meta.hot`, but resolving
    // the cache-busting URL against `import.meta.url` yields an `http:` URL
    // (vitest's module server) that Node's ESM loader can't import.
    const freshUrl = new URL(`${resolvedPath}?t=${Date.now()}`, import.meta.url).href;
    return import(/* @vite-ignore */ freshUrl) as Promise<AnyResModule>;
  }

  return moduleLoaders[resolvedPath]!();
});

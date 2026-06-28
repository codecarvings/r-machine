// vite-plugin-r-machine-hmr.ts
import type { Plugin } from "vite";

// HMR for R-Machine resource modules in a Vite dev environment.
//
// On a file change we walk Vite's module graph UP from the changed file to find
// every RESOURCE module that (transitively) imports it, then send a custom
// "r-machine:update" event per resource so the client can `reloadModule` it.
//
// Walking the graph is what makes editing a TRANSITIVE dependency work — e.g. a
// PORT or shared lib OUTSIDE the r-machine dir (`fetchProducts` in `lib/…`). A
// naive "is this file a resource?" check would miss those: the changed file is
// not itself a resource, but a resource depends on it.
//
// NOTE: we read `server.moduleGraph` (the dev server's graph), NOT the
// per-environment `ctx.modules` — the latter can come back empty for the
// cache-busted / `@vite-ignore`'d dynamic imports the loader uses, while the
// server graph reliably holds the importer edges.
//
// Change it as needed to fit your project structure and module paths.

const R_MACHINE_DIR = import.meta.dirname;
const EXT_RE = /\.(ts|tsx)$/;

// The r-machine loader-path (e.g. `shell/landing-page/en`, `inner/catalog`) for
// an absolute file path, or null when the file is not a resource module.
// Resources live under `R_MACHINE_DIR` in a subdirectory, so a relative path
// WITHOUT a `/` (e.g. `setup`, `resource-atlas`) is excluded.
function toResourcePath(file: string): string | null {
  const prefix = `${R_MACHINE_DIR}/`;
  if (!file.startsWith(prefix) || !EXT_RE.test(file)) {
    return null;
  }
  // Resources live under `pub/` (client-safe) or `prv/` (server-only); strip
  // that leading segment so the path matches the r-machine namespace.
  const rel = file
    .slice(prefix.length)
    .replace(EXT_RE, "")
    .replace(/^(pub|prv)\//, "");
  return rel.includes("/") ? rel : null;
}

export function rMachineHmr(): Plugin {
  return {
    name: "r-machine:hmr",
    apply: "serve",
    hotUpdate({ file, type }) {
      if (this.environment.name !== "client") {
        return;
      }
      // Per-environment module graph (the non-deprecated API). In `hotUpdate`,
      // `this.environment` is the environment being processed — here gated to
      // "client" above. Avoids the deprecated mixed `server.moduleGraph`.
      const { moduleGraph } = this.environment;

      if (type === "delete") {
        this.environment.hot.send({ type: "full-reload" });
        return [];
      }

      if (type !== "update") {
        return;
      }

      // BFS up the importer graph. Collect resource modules reached; STOP at the
      // first resource layer — R-Machine's `reloadModule` → `invalidate` already
      // cascades to resource-dependents via its own reverse-dep graph, so we
      // needn't walk resource → resource here.
      //
      // As we go we ALSO bump each traversed module's HMR timestamp. This is
      // what makes a transitive change actually fresh: when the client re-imports
      // the affected resource (cache-busted `?t=`), Vite re-transforms it and
      // rewrites each import URL with the imported module's `lastHMRTimestamp`.
      // Because we suppress Vite's default HMR (`return []` below), those
      // timestamps would otherwise NOT advance for a transitive dep (e.g. a port)
      // → the resource would re-evaluate but bind the browser-cached STALE dep.
      // Bumping the whole walked chain makes every level's URL fresh.
      const hmrTimestamp = Date.now();
      const affected = new Set<string>();
      const seen = new Set<unknown>();
      const stack = [...(moduleGraph.getModulesByFile(file) ?? [])];
      while (stack.length > 0) {
        const mod = stack.pop();
        if (!mod || seen.has(mod)) {
          continue;
        }
        seen.add(mod);
        // Skip Vite-internal / virtual modules (no real source file).
        if (!mod.id || mod.id.startsWith("\x00")) {
          continue;
        }
        // Force a fresh URL for this module in re-transformed importers.
        moduleGraph.invalidateModule(mod, new Set(), hmrTimestamp, true);
        // `mod.file` ignores any `?t=`/`?import` query, so cache-busted resource
        // variants still map back to their resource loader-path.
        const resourcePath = mod.file ? toResourcePath(mod.file) : null;
        if (resourcePath) {
          affected.add(resourcePath);
          continue;
        }
        for (const importer of mod.importers) {
          stack.push(importer);
        }
      }

      // Not an r-machine resource (nor a dependency of one) → let Vite handle it
      // normally (e.g. React Fast Refresh for components).
      if (affected.size === 0) {
        return;
      }

      for (const resourcePath of affected) {
        this.environment.hot.send({
          type: "custom",
          event: "r-machine:update",
          data: {
            file: resourcePath,
            changeType: type,
            timestamp: Date.now(),
          },
        });
      }

      return [];
    },
  };
}

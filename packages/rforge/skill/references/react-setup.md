# R-Machine — React (Vite / CRA) Setup

Use this guide when scaffolding R-Machine from scratch into a React project
(Vite, Create React App, or similar bundler — no Next.js).

---

## 0. Packages

Use whichever package manager the project already uses:

```bash
# pnpm
pnpm add r-machine @r-machine/react
pnpm add -D @r-machine/testing

# npm
npm install r-machine @r-machine/react
npm install --save-dev @r-machine/testing

# yarn
yarn add r-machine @r-machine/react
yarn add --dev @r-machine/testing

# bun
bun add r-machine @r-machine/react
bun add --dev @r-machine/testing
```

---

## 1. What to ask before writing any file

- **Locales** — e.g. `["en", "it"]`
- **Default locale** — e.g. `"en"`
- **Locale storage** — where should the selected locale be persisted?
  - `localStorage` (default, simplest)
  - `cookie`
  - other (user defines)
- **Kit** — does the project need a formatter shell (`shell/lib/fmt`)? Recommended.

---

## 2. Files to create

All files live under `src/r-machine/`.

### 2.1 `resource-atlas.ts`

```ts
// src/r-machine/resource-atlas.ts
import { defineLayout } from "r-machine";

const folders = defineLayout({
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

// Note: React projects do not use gear:inner (server-only family).
// Add gear:inner only if the project is used in a server context.

type ResourceMap = {
  // Resources will be added here as they are scaffolded
  // e.g. "outer/counter": Outer_Counter;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
```

### 2.2 `setup.ts`

```ts
// src/r-machine/setup.ts
import { ReactStandardStrategy } from "@r-machine/react";
import { RMachine, type RMachineLocale } from "r-machine";
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "./resource-atlas";

// Vite: statically analysed at build time for code splitting
const moduleLoaders = import.meta.glob<AnyResModule>("./**/*.{tsx,ts}", {});

const rMachine = RMachine.create({
  locales: ["en", "it"] as const, // ← replace with real locales
  defaultLocale: "en", // ← replace with real default
  ResourceAtlas,
  load: async (path) => {
    const tsx = `./${path}.tsx`;
    const ts = `./${path}.ts`;
    const resolved = moduleLoaders[tsx] ? tsx : moduleLoaders[ts] ? ts : null;
    if (!resolved) throw new Error(`R-Machine: module not found: ${path}`);
    return moduleLoaders[resolved]!();
  },
  shellKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
  experimental: {
    outerGear: "on",
  },
});

export const { BaseGear, OuterGear, Shell, localized } =
  rMachine.createToolset();
export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";

export const strategy = ReactStandardStrategy.create(rMachine, {
  kit: { fmt: "shell/lib/fmt" }, // remove if not using a formatter shell
  localeDetector: () => rMachine.localeHelper.matchLocales(navigator.languages),
  localeStore: {
    get: () => localStorage.getItem("locale") ?? undefined,
    set: (next) => localStorage.setItem("locale", next),
  },
});

export const { localeHelper } = strategy.getHelpers();
```

**Locale storage variants:**

Cookie instead of localStorage:

```ts
localeStore: {
  get: () => document.cookie.match(/locale=([^;]+)/)?.[1],
  set: (next) => { document.cookie = `locale=${next}; path=/`; },
},
```

No persistence (always detect from browser):

```ts
// Omit localeStore entirely — locale is detected fresh every page load
```

### 2.3 `toolset.ts`

```ts
// src/r-machine/toolset.ts
import { strategy } from "./setup";

export const { ReactRMachine, Plug, VertexFrame } =
  await strategy.createToolset();
```

### 2.4 Update `App.tsx` (or `main.tsx`)

Wrap the root with `ReactRMachine`. It handles locale resolution and
suspense-based resource loading.

```tsx
// src/App.tsx
import { ReactRMachine } from "@/r-machine/toolset";

export default function App() {
  return (
    <ReactRMachine fallback={<div>Loading…</div>}>
      {/* your app */}
    </ReactRMachine>
  );
}
```

If locale switching is needed in the UI, pass `writeLocale`:

```tsx
import { localeHelper } from "@/r-machine/setup";

<ReactRMachine
  writeLocale={(next) => localStorage.setItem("locale", next)}
  fallback={<div>Loading…</div>}
>
  {/* your app */}
</ReactRMachine>;
```

---

## 3. Summary checklist

| File                              | Notes                                   |
| --------------------------------- | --------------------------------------- |
| `src/r-machine/resource-atlas.ts` | Layout + empty ResourceMap              |
| `src/r-machine/setup.ts`          | RMachine.create + ReactStandardStrategy |
| `src/r-machine/toolset.ts`        | strategy.createToolset()                |
| `src/App.tsx`                     | Wrap root with `<ReactRMachine>`        |

Then remind the user: once the config files exist, use the scaffold skill
normally to add `gear:base`, `gear:outer`, `shell`, etc.

Also remind them: `shell/lib/fmt` is referenced in `shellKit` and `kit` but
does not yet exist in `resource-atlas.ts`. Scaffold it first as a
`shell(mono)` resource, or remove the kit references if no formatter is needed.

---

## 4. HMR support (Vite only)

HMR for R-Machine requires two parts: a **Vite plugin** (server-side, detects
file changes and sends custom events) and a **client-side handler** in
`setup.ts` (reacts to those events and reloads the changed module).

Without HMR the app still works — resources reload on full page refresh.

### 4.1 Create the Vite plugin

Place this file alongside `setup.ts` inside the `r-machine/` folder:

```ts
// src/r-machine/vite-plugin-r-machine-hmr.ts
import type { Plugin } from "vite";

// HMR for R-Machine resource modules. On a file change it walks Vite's module
// graph UP from the changed file to find every RESOURCE module that
// (transitively) imports it, then sends a custom "r-machine:update" event per
// resource so the client can `reloadModule` it. Walking the graph is what makes
// editing a TRANSITIVE dependency — a port, or a shared lib OUTSIDE r-machine/ —
// also refresh its consumers. R_MACHINE_DIR points to this plugin file's
// directory — adjust if you move it outside src/r-machine/.

const R_MACHINE_DIR = import.meta.dirname;
const EXT_RE = /\.(ts|tsx)$/;

// The r-machine loader-path (e.g. `shell/landing-page/en`, `inner/catalog`) for
// an absolute file path, or null when the file is not a resource module.
// Resources live in a subdirectory, so a relative path without a `/`
// (e.g. `setup`, `resource-atlas`) is excluded.
function toResourcePath(file: string): string | null {
  const prefix = `${R_MACHINE_DIR}/`;
  if (!file.startsWith(prefix) || !EXT_RE.test(file)) return null;
  const rel = file.slice(prefix.length).replace(EXT_RE, "");
  return rel.includes("/") ? rel : null;
}

export function rMachineHmr(): Plugin {
  return {
    name: "r-machine:hmr",
    apply: "serve",
    hotUpdate({ file, type }) {
      if (this.environment.name !== "client") return;
      // Per-environment module graph (the non-deprecated API).
      const { moduleGraph } = this.environment;

      if (type === "delete") {
        if (toResourcePath(file)) {
          this.environment.hot.send({ type: "full-reload" });
          return [];
        }
        return;
      }
      if (type !== "update") return;

      // BFS up the importer graph; stop at the first resource layer — R-Machine's
      // reloadModule → invalidate cascades to resource-dependents via its own
      // reverse-dep graph. As we go we bump each module's HMR timestamp: the
      // cache-busted resource re-import then gets FRESH transitive deps (Vite
      // rewrites import URLs with the imported module's lastHMRTimestamp).
      // Without this, suppressing Vite's default HMR (`return []` below) would
      // leave a transitive dep browser-cached → the resource would re-evaluate
      // but bind the STALE dep.
      const hmrTimestamp = Date.now();
      const affected = new Set<string>();
      const seen = new Set<unknown>();
      const stack = [...(moduleGraph.getModulesByFile(file) ?? [])];
      while (stack.length > 0) {
        const mod = stack.pop();
        if (!mod || seen.has(mod)) continue;
        seen.add(mod);
        if (!mod.id || mod.id.startsWith("\x00")) continue; // skip virtual modules
        moduleGraph.invalidateModule(mod, new Set(), hmrTimestamp, true);
        const resourcePath = mod.file ? toResourcePath(mod.file) : null;
        if (resourcePath) {
          affected.add(resourcePath);
          continue;
        }
        for (const importer of mod.importers) stack.push(importer);
      }

      // Unrelated to r-machine → let Vite handle it (e.g. React Fast Refresh).
      if (affected.size === 0) return;

      for (const resourcePath of affected) {
        this.environment.hot.send({
          type: "custom",
          event: "r-machine:update",
          data: { file: resourcePath, changeType: type, timestamp: Date.now() },
        });
      }
      return []; // suppress the default HMR update
    },
  };
}
```

### 4.2 Register the plugin in `vite.config.ts`

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { rMachineHmr } from "./src/r-machine/vite-plugin-r-machine-hmr";

export default defineConfig({
  plugins: [react(), rMachineHmr()],
});
```

### 4.3 Add the client-side handler in `setup.ts`

Add this block after `rMachine` is created — it just invalidates the changed
resource; the next resolve re-imports it via the always-cache-busting `load`:

```ts
// After RMachine.create(...):
if (import.meta.hot) {
  import.meta.hot.on("r-machine:update", ({ file }) => {
    rMachine.reloadModule(file);
  });
}
```

Then make `load` cache-bust in dev. `load` only runs on a blueprint cache miss
(initial load + after `reloadModule`), so the always-fresh import is not
per-render overhead — and there's no module-scoped reload set to desync with the
globalThis RMachine singleton's captured `load` closure:

```ts
load: async (path) => {
  const tsx = `./${path}.tsx`;
  const ts  = `./${path}.ts`;
  const resolved = moduleLoaders[tsx] ? tsx : moduleLoaders[ts] ? ts : null;
  if (!resolved) throw new Error(`R-Machine: module not found: ${path}`);

  if (import.meta.hot) {
    // In dev, ALWAYS import with a cache-busting query so an HMR-invalidated
    // module (and its freshly-bumped transitive deps) is re-fetched.
    const freshUrl = new URL(`${resolved}?t=${Date.now()}`, import.meta.url).href;
    return import(/* @vite-ignore */ freshUrl) as Promise<AnyResModule>;
  }

  return moduleLoaders[resolved]!();
},
```

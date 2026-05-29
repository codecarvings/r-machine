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

// Detects changes to R-Machine resource files and sends custom HMR events
// to the client so it can reload only the changed module.
// R_MACHINE_DIR points to the directory where this plugin file lives —
// adjust if you move the file outside of src/r-machine/.

const R_MACHINE_DIR = import.meta.dirname;
const EXT_RE = /\.(ts|tsx)$/;

export function rMachineHmr(): Plugin {
  return {
    name: "r-machine:hmr",
    apply: "serve",
    hotUpdate({ file, type }) {
      if (this.environment.name !== "client") return;
      if (!EXT_RE.test(file)) return;

      const prefix = `${R_MACHINE_DIR}/`;
      if (!file.startsWith(prefix)) return;

      const relativePath = file.slice(prefix.length).replace(EXT_RE, "");
      if (!relativePath.includes("/")) return; // skip top-level files (setup.ts, etc.)

      if (type === "delete") {
        this.environment.hot.send({ type: "full-reload" });
        return [];
      }

      if (type !== "update") return;

      this.environment.hot.send({
        type: "custom",
        event: "r-machine:update",
        data: { file: relativePath, changeType: type, timestamp: Date.now() },
      });

      return []; // suppress the default HMR update for this file
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

Add this block after `rMachine` is created, and update the `load` function
to support cache-busting for changed modules:

```ts
// After RMachine.create(...):
const modulesToReload = new Set<string>();
if (import.meta.hot) {
  import.meta.hot.on("r-machine:update", ({ file, changeType }) => {
    console.log(`[HMR] ${changeType} detected in ${file}`);
    modulesToReload.add(file);
    rMachine.reloadModule(file);
  });
}

// Inside the load function, before the final return:
if (import.meta.hot && modulesToReload.has(path)) {
  modulesToReload.delete(path);
  const freshUrl = new URL(`${resolved}?t=${Date.now()}`, import.meta.url).href;
  return import(/* @vite-ignore */ freshUrl) as Promise<AnyResModule>;
}
```

Full `load` function with HMR support:

```ts
load: async (path) => {
  const tsx = `./${path}.tsx`;
  const ts  = `./${path}.ts`;
  const resolved = moduleLoaders[tsx] ? tsx : moduleLoaders[ts] ? ts : null;
  if (!resolved) throw new Error(`R-Machine: module not found: ${path}`);

  if (import.meta.hot && modulesToReload.has(path)) {
    modulesToReload.delete(path);
    const freshUrl = new URL(`${resolved}?t=${Date.now()}`, import.meta.url).href;
    return import(/* @vite-ignore */ freshUrl) as Promise<AnyResModule>;
  }

  return moduleLoaders[resolved]!();
},
```

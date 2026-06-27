# R-Machine — Standalone / Node Setup (container-free, `DirectPlug`)

Use this guide when adding R-Machine to a plain Node project with **no framework
strategy** — a CLI, a queue worker, a cron job, or a React Email template.
Resources are consumed container-free via `DirectPlug` (the locale is passed
explicitly to `useR(locale)`). Canonical working reference: `examples/standalone`.

`DirectPlug` consumes only the `valid@direct` families — **`gear:base`, `shell`,
`shell(mono)`**. No `outer`/`inner`/`vertex` gears (those need a stateful
container, i.e. a strategy). See
[patterns/consume/direct-plug.md](./patterns/consume/direct-plug.md).

---

## 0. Packages

Only the `r-machine` core — no `@r-machine/react` / `@r-machine/next`. Use
whichever package manager the project already uses:

```bash
# pnpm
pnpm add r-machine
pnpm add -D @r-machine/testing
```

`tsx` (or another TS runner) is handy for running the CLI; `typescript` + `vitest`
for the test setup.

---

## 1. What to ask before writing any file

- **Locales** — e.g. `["en", "it"]`
- **Default locale** — e.g. `"en"`
- **`directKit`** — which shared resources to surface as `$.kit` (e.g. a
  `shell/lib/fmt` formatter)? Optional.

No strategy / proxy / origin questions — standalone has no framework.

---

## 2. Files to create

All files live under `src/r-machine/`.

### 2.1 `resource-atlas.ts`

Only the families DirectPlug can consume: base gears + shells.

```ts
// src/r-machine/resource-atlas.ts
import { defineLayout } from "r-machine";
import type { Base_Config } from "./pub/base/config.ts";
import type { Shell_Greeting } from "./pub/shell/greeting/en.ts";
import type { Shell_Lib_Fmt } from "./pub/shell/lib/fmt.ts";

const folders = defineLayout({
  "base/": "gear:base",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "base/config": Base_Config;
  "shell/greeting": Shell_Greeting;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}

// REQUIRED: getTokenBuilder() runs the atlas's compile-time self-check (every
// ResourceMap key must match a layout prefix) and returns the token factory.
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
```

### 2.2 `pub/loader.ts` — the explicit module map

Resource modules live under `src/r-machine/pub/` ("public" — client-safe), and
the loader lives alongside them in `pub/loader.ts`. The loader is an explicit
module map (no bundler glob), so it resolves identically everywhere: plain `tsx`
(the CLI), Vite (vitest), and `verifyResourceAtlas`. Standalone has no bundle
boundary, so a single catch-all (`["*"]`) loader covers everything.

```ts
// src/r-machine/pub/loader.ts
import type { AnyResModule } from "r-machine/core";
import { ResourceAtlas } from "../resource-atlas.ts";

// Explicit module map — the bundler-free loader. Each entry is a LITERAL
// `import(...)` resolved relative to this folder (pub/). The map key is the
// resolved path the loader receives — already locale-suffixed for shells.
const modules: Record<string, () => Promise<AnyResModule>> = {
  "base/config": () => import("./base/config.ts"),
  "shell/greeting/en": () => import("./shell/greeting/en.ts"),
  "shell/greeting/it": () => import("./shell/greeting/it.ts"),
  "shell/lib/fmt": () => import("./shell/lib/fmt.ts"),
};

// A single loader. The fn receives the full resolved path; look it up
// in the explicit module map.
ResourceAtlas.loader.register(["*"], (path) => {
  const loader = modules[path];
  if (!loader) {
    throw new Error(`Resource module not registered: "${path}"`);
  }
  return loader();
});
```

Note: every new resource must be added **both** to the `modules` map in
`pub/loader.ts` (so the loader can find it) and to `resource-atlas.ts` (so it is
typed).

### 2.3 `setup.ts` — `RMachine.create` directly, **no strategy**

The machine is **exported** — there is no strategy to hold it, so consumers and
`verifyResourceAtlas` reach it directly.

```ts
// src/r-machine/setup.ts
import { RMachine, type RMachineLocale } from "r-machine";
import { ResourceAtlas } from "./resource-atlas.ts";
import "./pub/loader.ts"; // registers the loader (§2.2)

export const rMachine = RMachine.create({
  locales: ["en", "it"], // ← replace with real locales
  defaultLocale: "en", // ← replace with real default
  ResourceAtlas,
  // Ambient shared resources surfaced as `$.kit` on direct plugs.
  directKit: {
    fmt: "shell/lib/fmt", // remove if not using a formatter shell
  },
});

export const { BaseGear, Shell, DirectPlug, localized } =
  rMachine.createToolset();
export const { localeHelper } = rMachine; // content negotiation / locale enumeration

export type Locale = RMachineLocale<typeof rMachine>;
export type { BrandedResource as RShape } from "r-machine";
```

### 2.4 First resources

A `gear:base` and a `shell` (canonical + one file per extra locale). For the
formatter referenced by `directKit`, scaffold a `shell(mono)` — see Step "First
resource" below and [patterns/shell.md](./patterns/shell.md).

```ts
// src/r-machine/pub/base/config.ts
import { BaseGear, type RShape } from "@/r-machine/setup.ts";

export const r = BaseGear.define(() => ({ appName: "R-Machine Standalone" }));
export type Base_Config = RShape<typeof r>;
```

```ts
// src/r-machine/pub/shell/greeting/en.ts — canonical locale file (defines the shape)
import type { RShape } from "@/r-machine/setup.ts";

export const r = {
  title: "Welcome",
  greet: (name: string) => `Hello, ${name}!`,
};
export type Shell_Greeting = RShape<typeof r>;
```

```ts
// src/r-machine/pub/shell/greeting/it.ts — variant: exact-key checked against `en`
import { localized } from "@/r-machine/setup.ts";

export const r = localized("shell/greeting", {
  title: "Benvenuto",
  greet: (name: string) => `Ciao, ${name}!`,
});
```

---

## 3. Consume via `DirectPlug` (+ entrypoint)

`DirectPlug(...)` is list/map form like any plug; `useR(locale)` is **async** and
takes the locale explicitly. Attach the plug to the consumer (`render.plug`) so
tests can mock it.

```ts
// src/render.ts
import { DirectPlug, type Locale } from "./r-machine/setup.ts";

const plug = DirectPlug("shell/greeting", "base/config");
export async function render(locale: Locale): Promise<string> {
  const [greeting, config, $] = await plug.useR(locale);
  return `[${$.locale}] ${greeting.greet("Sergio")} | app: ${config.appName} | ${$.kit.fmt.currency(12345.6)}`;
}
render.plug = plug;
```

```ts
// src/main.ts — drive the renderer over every configured locale
import { localeHelper } from "./r-machine/setup.ts";
import { render } from "./render.ts";

for (const locale of localeHelper.locales) {
  console.log(await render(locale));
}
```

---

## 4. `tsconfig.json` essentials

The `.ts` import extensions above require `allowImportingTsExtensions` (with
`noEmit`) and bundler resolution:

```jsonc
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "types": ["node", "vitest/globals"],
  },
  "include": ["src", "tests"],
}
```

---

## 5. Tests + verify (default)

Set up tests (scaffolded by default — see [testing.md](./testing.md)). The `test`
script type-checks first so a drifted typed mock fails instead of passing green:

```jsonc
// package.json
"scripts": {
  "start": "tsx src/main.ts",
  "typecheck": "tsc --noEmit",
  "test": "tsc --noEmit && vitest run"
}
```

Baseline `verifyResourceAtlas` — standalone has no strategy, so point it at the
exported `rMachine` instance:

```ts
// tests/r-machine/setup.test.ts
import { verifyResourceAtlas } from "@r-machine/testing";

it("every declared resource resolves through the loader", async () => {
  const report = await verifyResourceAtlas(
    import.meta.resolve("../../src/r-machine/setup.ts"),
    { strategyExportName: "rMachine" },
  );
  expect(report.issues).toEqual([]);
  expect(report.totalChecks).toBeGreaterThan(0);
});
```

vitest config for a Node/standalone project: see the **Standalone / Node** block
in [testing.md](./testing.md).

Finally, run the typecheck gate (`tsc --noEmit`) — it should be clean. A `never`
type usually means `directKit` points at a namespace not yet registered in the
atlas (scaffold it, or remove the kit entry).

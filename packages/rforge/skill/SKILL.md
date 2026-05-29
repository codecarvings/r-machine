---
name: r-machine
description: >
  Scaffolds R-Machine into a Next.js or React project from scratch, OR adds a
  single resource (OuterGear, BaseGear, InnerGear, Shell, Vertex) to an existing
  R-Machine project and updates resource-atlas.ts automatically. Trigger when the
  user asks to set up / install / add r-machine, create the initial config, or
  scaffold a gear, shell, or locale-aware resource — including namespace patterns
  like "outer/name" or "shell/name".
---

# R-Machine Skill

You help developers with two distinct workflows:

1. **Initial project setup** — installing R-Machine and creating all config
   files from scratch in a Next.js or React project.
2. **Adding a resource** — creating a new gear/shell file and updating
   `resource-atlas.ts` in an existing R-Machine project.

**Always detect the mode first (Step 0) before doing anything else.**

---

## Step 0 — Detect the mode

Look at the project (or ask the user) to determine which mode applies:

**Initial setup** if:

- There is no `r-machine` folder in the project, OR
- `resource-atlas.ts` / `setup.ts` do not exist yet, OR
- The user explicitly says "set up r-machine", "install r-machine",
  "add r-machine to my project", or similar.

→ Go to **Section A: Initial Project Setup**.

**Adding a resource** if:

- `resource-atlas.ts` and `setup.ts` already exist, AND
- The user asks to add a gear, shell, or other resource.

→ Go to **Section B: Adding a Resource** (Step 1 onwards).

---

## Section A — Initial Project Setup

Read `references/next-setup.md` for Next.js App Router projects.
Read `references/react-setup.md` for React (Vite/CRA) projects.

### A.1 — Identify the framework

Check if the project has:

- `next.config.*` → **Next.js App Router**
- `vite.config.*` / `react-scripts` / no server framework → **React**

If unclear, ask the user.

### A.2 — Gather required information

For **Next.js**, ask (or infer from context):

1. Which routing strategy? Path / Flat / Origin
2. Locales (e.g. `["en", "it"]`) and default locale
3. Path strategy only: proxy or no-proxy?
4. Origin strategy only: the origin map (`{ en: "https://…", it: "https://…" }`)
5. Use `PathAtlas` for localised URLs? (optional, safe to skip for now)
6. Use a formatter shell (`shell/lib/fmt`)? Recommended — default yes.

For **React**, ask (or infer):

1. Locales and default locale
2. Locale persistence: `localStorage` (default), cookie, or none

Don't ask for everything at once if the intent is already clear from the
message.

### A.3 — Generate the files

Follow the framework-specific reference file exactly. Generate all required
files and show them to the user. Explain any placeholder that needs
customisation (real domain names, locale lists, etc.).

### A.4 — Next steps after initial setup

After generating the config files, tell the user:

1. **Install the packages** using the package manager already in the project — see the reference file for the exact command per package manager.
   - **Next.js**: `r-machine`, `@r-machine/react`, `@r-machine/next` (prod) + `@r-machine/testing` (dev)
   - **React**: `r-machine`, `@r-machine/react` (prod) + `@r-machine/testing` (dev)
2. **`shell/lib/fmt` is not yet created** — if the kit references it, scaffold
   it as the first resource. Use the `shell(mono)` pattern from `patterns.md`.
3. From now on, use this skill normally to add gears and shells (Section B).

---

## Section B — Adding a Resource

### Step 1 — Understand what the user wants

Gather (from the message or by asking) these four things:

1. **Resource kind** — which family? `gear:outer`, `gear:base`, `gear:inner`,
   `gear:outer(vertex)`, `shell`, `shell(mono)`. If the user says "gear" without
   qualification, ask or infer from context.
2. **Namespace** — the full atlas key, e.g. `outer/cart` or `shell/product`.
   If the user gives a name but not a full namespace, ask.
3. **Shape** — what members should the resource expose? A brief description
   is enough — you will translate it into the factory body.
4. **Dependencies** — any deps (`withDeps`) or external functions (`withPorts`)?
   For `OuterGear`, is it stateful (`withState`)?

   Valid dep families per resource kind (never suggest anything outside these):
   - `gear:outer` → `gear:base`, `gear:outer`
   - `gear:base` → `gear:base`
   - `gear:inner` → `gear:base`, `gear:inner`
   - `shell` / `shell(mono)` → `shell`, `shell(mono)`, `gear:base` (only if in `bridgeGears`)
   - `gear:outer(vertex)` → same as `gear:outer`

   **Shells (`shell`, `shell(mono)`) can never be deps of any gear.**
   Never suggest a `shell/…` namespace as a dep when the resource being
   created is a gear.

Don't ask for all four upfront if some are already obvious from the request.
Clarify only what's missing.

---

## Step 2 — Explore the project (read `resource-atlas.ts` and `setup.ts`)

Find the `r-machine` folder (typically `src/r-machine/`). You need two files:

### `resource-atlas.ts`

Read it to learn:

- The `defineLayout` prefix → family map (which folders exist).
- Existing `ResourceMap` entries (to avoid collisions).
- The import style used for existing entries — relative (`"../setup"`) or
  alias (`"@/r-machine/setup"`) — you will mirror it.

### `setup.ts`

Read it to learn:

- The locales list (e.g. `locales: ["en", "it"]`) — you'll need this for
  multi-locale shells.
- The `bridgeGears` list — determines whether a base gear can be depended on
  by a shell.
- The framework (`ReactStandardStrategy` → React; any `NextApp*Strategy` →
  Next.js). This affects whether you mention `Plug`/`ClientPlug`/`ServerPlug`
  in the output.

---

## Step 3 — Derive file path and type name

### File path

The namespace maps directly to a file path relative to `resource-atlas.ts`:

| Namespace       | File                                                 |
| --------------- | ---------------------------------------------------- |
| `outer/cart`    | `outer/cart.ts`                                      |
| `base/logger`   | `base/logger.ts`                                     |
| `inner/session` | `inner/session.ts`                                   |
| `vertex/search` | `vertex/search.ts` (same composer as `gear:outer`)   |
| `shell/product` | `shell/product/en.tsx` (+ one file per extra locale) |
| `shell/lib/fmt` | `shell/lib/fmt.ts` (mono — single file)              |

For multi-locale shells, the canonical file is `en.tsx` (or the project's
`defaultLocale`). Additional locale files live as siblings.

**Shell file extension — default to `.tsx`.** Multi-locale content shells
routinely embed JSX (rich text, `<strong>`, components inside members), so the
established convention is `.tsx`. Use `.ts` only when the shell is provably
plain (strings/objects, no JSX) — e.g. a `shell(mono)` helper like
`shell/lib/fmt.ts`. The `load` resolver tries both extensions, but a `.ts`
file breaks the moment a member returns JSX, so prefer `.tsx` for content
shells. Gears (`outer/`, `base/`, `inner/`, `vertex/`) are always `.ts`.

### Type name convention

Convert each `/`-delimited segment to PascalCase, join with `_`:

| Namespace                | Type name                |
| ------------------------ | ------------------------ |
| `outer/cart`             | `Outer_Cart`             |
| `base/logger`            | `Base_Logger`            |
| `inner/session`          | `Inner_Session`          |
| `vertex/search`          | `Vertex_Search`          |
| `shell/product`          | `Shell_Product`          |
| `shell/features/box_1_2` | `Shell_Features_Box_1_2` |
| `shell/lib/fmt`          | `Shell_Lib_Fmt`          |

Segments that already contain underscores or numbers keep them: `box_1_2` →
`Box_1_2`.

### Import path from the new file to `setup.ts`

The resource file imports from `setup.ts`. Count the directory depth of the
new file relative to the `r-machine/` folder and compute the relative path,
or mirror the alias style (`@/r-machine/setup`) if the project uses it.

Examples (file is inside `r-machine/`):

- `outer/cart.ts` → `import { OuterGear, type RShape } from "../setup";`
- `shell/product/en.tsx` → `import { Shell, type RShape } from "../../setup";`
- `shell/lib/fmt.ts` → `import { Shell, type RShape } from "../../setup";`

If the project uses a path alias (e.g. `@/r-machine/setup`), use that instead
of the relative path. Mirror exactly what the existing resource files do.

---

## Step 4 — Write the resource file(s)

Consult `references/patterns.md` for the code template for the chosen family.
Fill in the namespace-derived type name, member names, and any deps or state
the user described.

Key rules (enforced by the TS compiler — get them right upfront):

- `OuterGear` can depend on `gear:base` and other `gear:outer` only.
- `BaseGear` can depend on `gear:base` only.
- `InnerGear` can depend on `gear:inner` and `gear:base`.
- `Shell` can depend on `shell`, `shell(mono)`, and `gear:base` (only if
  listed in `bridgeGears`).
- `gear:outer(vertex)` **cannot be a dep of any resource** — it's consumer-only.
- Only `OuterGear` supports `withState` and cursor primitives (`_.action`,
  `_.getter`, `_.relay`).

For multi-locale shells: create one file per locale. The canonical (default
locale) file exports the type. All other locale files use `localized(...)`.

---

## Step 5 — Update `resource-atlas.ts`

Two edits:

1. **Add the type import** — after the last existing `import type` line, or in
   alphabetical order. The import path is relative to `resource-atlas.ts`.
2. **Add the `ResourceMap` entry** — inside `type ResourceMap = { ... }`.

For multi-locale shells, the atlas entry points to the canonical (default
locale) file.

Example additions for `outer/cart`:

```ts
// New import:
import type { Outer_Cart } from "./outer/cart";

// New ResourceMap entry:
"outer/cart": Outer_Cart;
```

Apply both edits with surgical precision — do not reformat unrelated lines.

---

## Step 6 — Confirm and summarise

After creating the files and updating the atlas, tell the user:

- Which files were created and where.
- What was added to `resource-atlas.ts`.
- The namespace the resource is reachable at.
- If relevant: remind them to add a `Plug("namespace")` in a component, or
  `withDeps("namespace")` in another resource, to consume the new resource.

If the user asked for `gear:outer(vertex)`, also mention the `<VertexFrame>`
pattern for sharing the instance across descendants.

If the user asked for a shell with deps on a base gear, remind them to check
that the base namespace is in `bridgeGears` in `setup.ts`.

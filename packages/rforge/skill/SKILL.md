---
name: r-machine
description: >
  Scaffolds R-Machine into a Next.js, React (Vite), or plain Node project (CLI,
  queue worker, cron, template renderer — consumed container-free via DirectPlug) from
  scratch, OR adds a single resource (OuterGear, BaseGear, InnerGear, Shell,
  Vertex) to an existing R-Machine project and updates resource-atlas.ts
  automatically, OR implements a whole feature in an existing R-Machine project by
  decomposing it into gears, shells, and a React consumer, OR modifies / evolves an
  existing resource or feature (change behavior, add a member, rename, remove) with
  a minimal compiler-verified blast radius. Trigger when the user asks to set up /
  install / add r-machine, create the initial config, scaffold a gear, shell, or
  locale-aware resource — including namespace patterns like "outer/name" or
  "shell/name" — or, inside an R-Machine project, implement, change, or refactor a
  feature / behavior / UI / resource.
---

# R-Machine Skill

You help developers with four distinct workflows:

1. **Initial project setup** — installing R-Machine and creating all config
   files from scratch in a Next.js, React (Vite), or plain Node / standalone
   project (the latter consumes R-Machine container-free via `DirectPlug`).
2. **Adding a resource** — creating a new gear/shell file and updating
   `resource-atlas.ts` in an existing R-Machine project.
3. **Implementing a feature** — turning a plain, high-level request ("a timer
   with start/stop", "a favorites list") into R-Machine's shape by decomposing it
   into gears (logic) + shells (localized content) + a React consumer (glue),
   then creating each piece via workflow 2.
4. **Modifying or evolving** — changing an existing resource or feature (add a
   member, change behavior, rename, remove). **This is where R-Machine shines:**
   the namespace is a stable contract, so a change behind it has a minimal,
   compiler-verifiable blast radius. Prefer this workflow whenever the target
   already exists.

**Always detect the mode first (Step 0) before doing anything else.**

---

## Reference files (load only what the task needs)

This skill is partitioned so each task reads a small slice, never the whole doc:

- **Setup** (one per mode): `references/{next-setup,react-setup,standalone-setup}.md`.
- **Decompose** (a feature → resources): `references/decompose.md` (Section C).
- **Modify** (change existing, blast radius): `references/modify.md` (Section D).
- **Patterns** (per resource family): `references/patterns/{outer,vertex,base,inner,shell}.md`.
- **Consume** (per plug): `references/patterns/consume/{plug,client-plug,server-plug,direct-plug}.md`.
- **Cross-cutting**: `references/patterns/{plugin-context,atlas-update,clone}.md`.
- **Testing & diagnostics**: `references/testing.md` (mockPlug, event bus).
- **Next advanced**: `references/next-features.md` (PathAtlas, locale switching, proxy, SSR, dev HMR).
- **Concepts** (the "why" — load only when a choice needs it): `references/concepts/*.md`.

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
- The user asks to add a **specific** resource — names a family (gear, shell,
  vertex…) or a namespace (`outer/name`, `shell/name`).

→ Go to **Section B: Adding a Resource** (Step 1 onwards).

**Implementing a feature** if:

- `resource-atlas.ts` and `setup.ts` already exist (it is an R-Machine project), AND
- The user asks for a **feature / behavior / UI in plain terms** ("add a timer",
  "build a favorites list", "let users filter the table") **without** naming a
  resource kind or namespace.

→ Go to **Section C: Implement a Feature**. (Section C decomposes the request,
then loops through Section B for each resulting resource.)

**Modifying or evolving** if:

- `resource-atlas.ts` and `setup.ts` already exist, AND
- The request targets something that **already exists** — change its behavior,
  add/rename/remove a member, extend a feature, fix a bug ("make the timer count
  down", "add a pause button to the timer", "rename `cart.add`", "remove X").

→ Go to **Section D: Modify or Evolve**. (Section D locates the owning
resource(s), edits behind the namespace, and reports the blast radius.)

**Tie-breaker:** if the target already exists, prefer **Modifying (D)** over
Adding (B) / Implementing (C) — B and C are for net-new resources/features.

---

## Section A — Initial Project Setup

Read `references/next-setup.md` for Next.js App Router projects.
Read `references/react-setup.md` for React (Vite) projects.
Read `references/standalone-setup.md` for plain Node projects (CLI, queue worker,
cron, template renderer) that consume R-Machine container-free via `DirectPlug`.

### A.1 — Identify the framework / mode

Check what the project has:

- `next.config.*` → **Next.js App Router** → `references/next-setup.md`
- `vite.config.*` / `react-scripts` → **React (Vite)** → `references/react-setup.md`
- Neither, and it's a plain Node project (CLI, queue worker, cron, template renderer) —
  or the user explicitly wants container-free usage → **Standalone / DirectPlug**
  → `references/standalone-setup.md`

If unclear, ask the user.

### A.2 — Gather required information

For **Next.js**, ask (or infer from context):

1. Which routing strategy? Path / Flat / Origin
2. Locales (e.g. `["en", "it"]`) and default locale
3. Path strategy only: proxy or no-proxy?
4. Origin strategy only: the origin map (`{ en: "https://…", it: "https://…" }`)
5. Use a formatter shell (`shell/lib/fmt`)? Recommended — default yes.

(An empty `path-atlas.ts` is created by default for every Next strategy — don't
ask about it.)

For **React**, ask (or infer):

1. Locales and default locale
2. Locale persistence: `localStorage` (default), cookie, or none

For **Standalone / Node**, ask (or infer):

1. Locales and default locale
2. Which shared resources to expose as `directKit` (e.g. a `shell/lib/fmt`
   formatter)? Optional.

(No strategy, proxy, or origin questions — standalone has no framework. Full
details in `references/standalone-setup.md`.)

Don't ask for everything at once if the intent is already clear from the
message.

### A.3 — Generate the files

Follow the framework-specific reference file exactly. Generate all required
files and show them to the user. Explain any placeholder that needs
customisation (real domain names, locale lists, etc.).

### A.4 — Next steps after initial setup

After generating the config files, tell the user:

1. **Install the packages** using the package manager already in the project — see the reference file for the exact command per package manager.
   - **Next.js**: `r-machine`, `@r-machine/react`, `@r-machine/next` (prod) + `@r-machine/testing`, `jiti` (dev — `jiti` powers `createNextDevImport` HMR)
   - **React**: `r-machine`, `@r-machine/react` (prod) + `@r-machine/testing` (dev)
   - **Standalone / Node**: `r-machine` (prod) + `@r-machine/testing` (dev) — no framework packages
2. **Set up tests (default).** Check for an existing test framework
   (`vitest.config.*`, a `vitest` devDependency). If none, propose configuring
   vitest and, if accepted, generate `vitest.config.ts` for the mode + a baseline
   `verifyResourceAtlas` test. R-Machine treats tests as a default, not an extra —
   see `references/testing.md`.
3. **Make the kit type-clean (required).** The kit points at `shell/lib/fmt`,
   which doesn't exist yet → the first `tsc` fails with a `never`. Either scaffold
   it as the first resource (`shell(mono)`, `references/patterns/shell.md`) and
   register it in the atlas, or remove the `fmt` kit entries. (Per-mode details in
   the setup reference.)
4. **Run the typecheck gate** (`tsc --noEmit`, or the project's `typecheck` /
   `build` script) — must be clean before declaring setup done.
5. From now on, use this skill normally to add gears and shells (Section B).

### A.5 — Write the agent routing stanza

So that a **later, plain feature request** (which names no R-Machine terms) still
routes through this skill, record that this is an R-Machine project in the agent
instruction files. Add the stanza below to **both** `CLAUDE.md` and `AGENTS.md`
at the project root:

- **Create** the file if it does not exist; **append** the stanza if it does —
  never overwrite existing content.
- **Idempotent** — skip a file that already contains an equivalent R-Machine
  routing stanza (do not duplicate).

```md
## R-Machine project

This project uses **R-Machine**. For any feature, behavior, or UI work — new or a
change to something that already exists — use the `r-machine` skill. Build new
work as **gears** (logic) + **shells** (localized content) + a **React consumer**
(glue); make changes behind the owning resource's namespace and check the blast
radius with `tsc`. Do not hand-roll ad-hoc state or hardcode localizable
user-facing text. See the skill's Section C (implement) and Section D (modify).
```

---

## Section C — Implement a Feature

A high-level request ("a timer with start/stop", "a favorites list") is not one
resource — it decomposes into several. Section C plans that decomposition, then
**dispatches each piece to Section B**; it creates nothing itself.

1. **Read [`references/decompose.md`](references/decompose.md)** — the forward
   procedure and the placement rubric.
2. **Decompose** the feature into logic (gears) / localized content (shells) /
   glue (a React consumer), and **emit a short plan** — per piece: resource kind,
   namespace, one-line shape. State any assumption you had to make (the
   "When in doubt" defaults in `decompose.md`).
3. **Confirm** the plan with the user in one short exchange.
4. **Dispatch**: for each resource in the plan, run **Section B (Step 1 →)**,
   picking the pattern file by family; for the component, follow the matching
   `references/patterns/consume/*.md`. Update the atlas per resource
   (`references/patterns/atlas-update.md`) and finish with the typecheck gate.
5. **Routing stanza fallback**: if this project's `CLAUDE.md` / `AGENTS.md` lacks
   the R-Machine routing stanza (e.g. it was set up by hand, or before this skill
   version), offer to add it — see **A.5** for the exact text and rules.

---

## Section D — Modify or Evolve

The mode where R-Machine earns **Uniformity Under Change**: a namespace is a
stable contract, so a change behind it has a minimal, compiler-verifiable blast
radius. Section D locates the owner(s), edits behind the namespace, and — the
whole point — **reports the blast radius** back. It edits existing resources; a
genuinely new piece it dispatches to Section B.

1. **Read [`references/modify.md`](references/modify.md)** — the locate → classify
   → edit → report procedure and the three kinds of change.
2. **Locate** the owning resource(s) via `resource-atlas.ts`. For a feature-level
   change spanning several resources, decompose the _change_ with the rubric in
   [`references/decompose.md`](references/decompose.md) to find every affected owner.
3. **Classify** each change — implementation-only (Surface unchanged) / additive
   (new member) / breaking (rename, remove, re-type) — then **edit behind the
   namespace**, keeping the Surface stable unless the contract must change.
4. **Run the typecheck gate** (`tsc --noEmit`). The compiler names exactly the
   consumers/tests a breaking change touches — update precisely those. Mocks and
   fixtures track the same contract, so a rename propagates into tests, not rot.
5. **Report the blast radius** explicitly: _"Surface unchanged → nothing
   downstream"_ / _"additive → only new usage"_ / _"breaking → tsc flagged these N
   sites, all updated"_. Make the property visible.

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

   Dependencies are declared the **same way at every site** — a list or a map of
   namespaces; only _which_ families are allowed changes, keyed on the declaring site.
   Valid **plain** dep families per resource kind — a plain dep resolves to the
   resource's own surface (never suggest anything outside these):
   - `gear:outer` → `gear:base`, `gear:outer`
   - `gear:base` → `gear:base`
   - `gear:inner` → `gear:base`, `gear:inner`
   - `shell` / `shell(mono)` → `shell`, `shell(mono)`, `gear:base` (only if in `bridgeGears`)
   - `gear:outer(vertex)` → same as `gear:outer`

   The **consumer** side is keyed too — each plug is pinned to a catalog, **not**
   unconstrained: `DirectPlug` → `base`, `shell`; `ServerPlug` → `inner`, `base`, `shell`;
   `Plug`/`ClientPlug` → `base`, `outer`, `vertex`, `shell`. (A `ClientPlug` cannot reach
   `inner/`; a `ServerPlug` cannot reach `outer/` — compile errors, not conventions.)
   Full matrix: `references/concepts/dep-asymmetry.md`.

   **A bare `shell/…` is never a plain dep of a gear.** A gear (or a shell)
   reaches a `Shell` only through `res.perLocale("shell/…")` inside `withDeps`:
   the dep then resolves to a locale loader `(locale) => Promise<Surface>`, not a
   surface — so a locale-agnostic gear can read localized content at runtime.
   Never suggest a _bare_ `shell/…` as a gear dep. (Asymmetry, `bridgeGears`, and
   `res.perLocale`: `references/concepts/dep-asymmetry.md`.)

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
  alias (`"@/r-machine/setup"` - preferred) — you will mirror it. If the project has
  no `@/` alias configured yet, the alias is still the preferred form: offer to
  initialize it (see the framework's setup ref — React/Next) rather than defaulting to
  relative paths. See Step 3.

### `setup.ts`

Read it to learn:

- The locales list (e.g. `locales: ["en", "it"]`) — you'll need this for
  multi-locale shells.
- The `bridgeGears` list — determines whether a base gear can be depended on
  by a shell.
- The framework / mode, from the `setup.ts` export shape:
  - `ReactStandardStrategy` → **React** → mention `Plug`.
  - any `NextApp*Strategy` → **Next.js** → mention `Plug`/`ClientPlug`/`ServerPlug`.
  - **no strategy** (just `rMachine.createToolset()`, a `directKit`, only
    `base/`+`shell/` families) → **Standalone / Node** → the only consumer is
    `DirectPlug`.
    Also, for consuming a shell outside any request/React context (e.g. a React
    Email template, a queue worker, a cron job) in a Next/React project, mention
    the framework-neutral `DirectPlug` — see
    `references/patterns/consume/direct-plug.md`.

---

## Step 3 — Derive file path and type name

### File path

The namespace maps directly to a file path relative to `resource-atlas.ts`. The path
includes the `pub/` (client-safe) or `prv/` (server-only `inner/`) segment; the
**namespace itself omits it** (atlas key stays `outer/cart`, not `pub/outer/cart`) — see
Step 4, "Where the file lives":

| Namespace       | File                                                     |
| --------------- | -------------------------------------------------------- |
| `outer/cart`    | `pub/outer/cart.ts`                                      |
| `base/logger`   | `pub/base/logger.ts`                                     |
| `inner/session` | `prv/inner/session.ts` (server-only family → `prv/`)     |
| `vertex/search` | `pub/vertex/search.ts` (same composer as `gear:outer`)   |
| `shell/product` | `pub/shell/product/en.tsx` (+ one file per extra locale) |
| `shell/lib/fmt` | `pub/shell/lib/fmt.ts` (mono — single file)              |

For multi-locale shells, the canonical file is `en.tsx` (or the project's
`defaultLocale`). Additional locale files live as siblings.

**Shell extension follows the project's UI.** In **React / Next** projects, content
shells are **always `.tsx`** — these render JSX, and `.tsx` is correct for plain
strings too and stays correct when you add formatted text/JSX, so there's no
per-shell decision. In a **standalone / plain Node** project (no JSX), content
shells are `.ts` — use `.tsx` there only for a shell that actually renders JSX
(e.g. a JSX email template). A `shell(mono)` code helper (`shell/lib/fmt`) is
`.ts` either way; gears (`outer/`, `base/`, `inner/`, `vertex/`) are always `.ts`.

### Type name convention

Split the namespace on `/` **and** `-`, PascalCase each part, join with `_`:

| Namespace                | Type name                |
| ------------------------ | ------------------------ |
| `outer/cart`             | `Outer_Cart`             |
| `outer/day-counter`      | `Outer_Day_Counter`      |
| `base/logger`            | `Base_Logger`            |
| `inner/session`          | `Inner_Session`          |
| `vertex/search`          | `Vertex_Search`          |
| `shell/product`          | `Shell_Product`          |
| `shell/features/box_1_2` | `Shell_Features_Box_1_2` |
| `shell/lib/fmt`          | `Shell_Lib_Fmt`          |

A hyphen inside a segment is a word separator, like `/` — it becomes `_`
(`day-counter` → `Day_Counter`). Existing underscores and numbers are kept
(`box_1_2` → `Box_1_2`).

### Import path from the new file to `setup.ts`

The resource file imports from `setup.ts`. **Prefer the `@/` alias** —
`import { OuterGear, type RShape } from "@/r-machine/setup";` — mirroring exactly what
the existing resource files do.

If the project has **no** `@/` alias configured, the alias is still the preferred form:
**propose initializing it and ask the user to confirm** (React →
`references/react-setup.md` §1.5; Next → `references/next-setup.md` §2), then import
through it. Fall back to relative paths only when creating the alias isn't feasible or
the user declines.

**Relative-path fallback.** Resources live under `pub/` (client-safe) or `prv/`
(server-only `inner/`); `setup.ts` sits one level above both. Count the directory depth
of the new file relative to the `r-machine/` folder and compute the relative path:

- `pub/outer/cart.ts` → `import { OuterGear, type RShape } from "../../setup";`
- `prv/inner/catalog.ts` → `import { InnerGear, type RShape } from "../../setup";`
- `pub/shell/product/en.tsx` → `import { Shell, type RShape } from "../../../setup";`
- `pub/shell/lib/fmt.ts` → `import { Shell, type RShape } from "../../../setup";`

---

## Step 4 — Write the resource file(s)

Consult the matching pattern file for the chosen family — load only that one:

| Family                  | Pattern file                    |
| ----------------------- | ------------------------------- |
| `gear:outer`            | `references/patterns/outer.md`  |
| `gear:outer(vertex)`    | `references/patterns/vertex.md` |
| `gear:base`             | `references/patterns/base.md`   |
| `gear:inner`            | `references/patterns/inner.md`  |
| `shell` / `shell(mono)` | `references/patterns/shell.md`  |

Cross-cutting: `references/patterns/plugin-context.md` (map vs list form) and
`references/patterns/atlas-update.md` (atlas edit). To consume the resource, see
`references/patterns/consume/<plug>.md`; to test it, `references/testing.md`.

**Where the file lives.** Resource files go under `src/r-machine/pub/<family>/…`
(client-safe: `base/`, `outer/`, `vertex/`, `shell/`, `shell/lib/`) or
`src/r-machine/prv/<family>/…` (server-only: `inner/`). The `pub/`/`prv/` segment
is filesystem-only — the atlas namespace is unchanged (still `outer/cart`,
`inner/catalog`, etc.). Place the file under the folder the existing loader
registration covers (`pub/loader.ts` for client-safe families, `prv/loader.ts`
for `inner/`). If a project predates the `pub/`/`prv/` split, mirror whatever
folder layout its existing resources use.

Fill in the namespace-derived type name, member names, and any deps or state
the user described.

Key rules (enforced by the TS compiler — get them right upfront):

- `OuterGear` can depend on `gear:base` and other `gear:outer` only.
- `BaseGear` can depend on `gear:base` only.
- `InnerGear` can depend on `gear:inner` and `gear:base`.
- `Shell` can depend on `shell`, `shell(mono)`, and `gear:base` (only if
  listed in `bridgeGears`).
- Any gear (or shell) reaches a `Shell` **only** via `res.perLocale("shell/…")`
  in `withDeps` → resolves to a loader `(locale) => Promise<Surface>`, never a
  plain surface; a bare `shell/…` is not a valid gear dep. (The rules above are
  plain, same-surface deps.)
- `gear:outer(vertex)` **cannot be a dep of any resource** — it's consumer-only.
- Consumers are keyed too — each plug is pinned to a catalog, **not** unconstrained:
  `DirectPlug` → `base` + `shell`; `ServerPlug` → `inner` + `base` + `shell`;
  `Plug`/`ClientPlug` → `base` + `outer` + `vertex` + `shell`. Same list/map declaration
  as `withDeps`; only the allowed set differs. (So a `ClientPlug` can't reach a server-only
  `inner/` gear — a compile error, not a convention.)
- Only `OuterGear` supports `withState` and cursor primitives (`_.action`,
  `_.getter`, `_.relay`).

For multi-locale shells: create one file per locale. The canonical (default
locale) file exports the type. All other locale files use `localized(...)`.

---

## Step 5 — Update `resource-atlas.ts`

Two edits (exact snippet, incl. `#`-prefixed internal namespaces, in
`references/patterns/atlas-update.md`):

1. **Add the type import** — with the other `import type` lines (alphabetical),
   path relative to `resource-atlas.ts`. For multi-locale shells, point at the
   canonical (default-locale) file.
2. **Add the `ResourceMap` entry** — inside `type ResourceMap = { ... }`.

Apply both edits with surgical precision — do not reformat unrelated lines.

---

## Step 6 — Test the new resource

Add (or update) the resource's test under `tests/`, **mirroring the source path**
(`src/r-machine/pub/shell/home/…` → `tests/r-machine/pub/shell/home.test.ts`) — a default,
not an option. Pass the resource to `mockPlug` and run its **real** members; see
the **Test it** section of the family's pattern file and the full set in
`references/testing.md`.
For a component, `mockPlug` the component (plug attached as `Comp.plug`) and seed
`ctrl.deps[…].state`.

**Exception — plain-object shells** (`export const r = { … }`, no `.define`) have
**no plug** — don't `mockPlug` or auto-test them (shape guarded by `localized(...)`).

Then run the test suite: the `test` script type-checks first, so a green run is
also the **gate** that the new resource, its atlas entry, and the mock compile.

---

## Step 7 — Confirm and summarise

After creating the files and updating the atlas, tell the user:

- Which files were created and where (including the test).
- What was added to `resource-atlas.ts`, and the namespace it's reachable at.
- To consume it: a `Plug("namespace")` in a component, or `withDeps("namespace")`
  in another resource.
- `gear:outer(vertex)` → also mention `<VertexFrame>` (share one instance across descendants).
- A shell with a base-gear dep → that base must be in `bridgeGears` (`setup.ts`).
- A new **Next page** (`app/[locale]/…/page.tsx`) → register its route in
  `path-atlas.ts` (per-locale translations unless Flat) — see `references/next-features.md`.

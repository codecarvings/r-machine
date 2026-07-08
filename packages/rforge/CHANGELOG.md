# rforge

## 1.0.0-alpha.15

### Patch Changes

- 125f246: Add `res.perLocale` — declare a locale-keyed shell as a dependency of a locale-agnostic gear (or another shell).

  A gear has no ambient locale, so it cannot hold a shell as a plain resolved surface. `res.perLocale("shell/x")` (from the toolset) declares the shell as a dependency whose resolved value is a **loader** `(locale) => Promise<Surface>` the resource calls with a locale it receives at runtime — e.g. an `InnerGear` that renders a multilingual email in the recipient's locale. The `locale` parameter is typed to the atlas's configured locale union (an invalid locale is a compile error). It works in `withDeps` of any gear family, and inside a `Shell` (to reuse another locale's content on demand). The plain-dependency asymmetry is unchanged: a bare `shell/…` is still not a valid gear dependency — `res.perLocale` is the one sanctioned bridge, resolving to a loader rather than a surface.

  Two resolution-time batch helpers fold multiple loaders into a single call: `res.perLocale.pickAll(loader | map)` resolves every configured locale, locale-major (`Record<Locale, …>`); `res.perLocale.pick(locale, map | tuple)` resolves a batch at one locale, preserving map/tuple shape.

  `@r-machine/testing`: a `res.perLocale` dependency is mocked with a function `(locale) => partial`, deep-merged over the real localized surface (per call, per alias).

  `rforge`: the bundled Skill documents `res.perLocale` / `pickAll` / `pick`, and corrects the former "a shell can never be a dependency of a gear" guidance.

- 125f246: Install the R-Machine Skill into both `.claude/skills` and `.agents/skills`, and make re-runs version-aware.

  `rforge skill` now seeds both Claude Code's `.claude/skills` and the vendor-neutral `.agents/skills` on a first install, so the Skill is picked up regardless of which agent tool runs. Re-runs no longer refuse with a blunt "already exists": each installed Skill carries a `.rforge-skill.json` manifest whose content hash is compared against the bundled Skill, so a re-run reports **up to date** (nothing written) or offers an **update** when the bundled Skill actually changed.

  ### Changed
  - On a fresh install (no `--out`), copy the Skill into every location in `DEFAULT_TARGETS` (`.claude/skills` + `.agents/skills`). When the Skill is already present in some of those locations, update **only** the ones already present — a location the user removed is never resurrected. `--out <dir>` still targets exactly one directory, bypassing the multi-target policy.
  - Stamp each installed Skill with a `.rforge-skill.json` manifest (`skill`, `rforgeVersion`, `sourceHash`, `installedAt`). A re-run classifies each target as `absent` / `current` / `stale` from its recorded `sourceHash`: all current → up-to-date (no write); an available update → interactive confirm (default yes) in a TTY, or exit 1 with a `--force` hint when non-interactive. `--force` refreshes every resolved target unconditionally.

- 125f246: Extend the bundled R-Machine Skill from scaffolding-only to the full change lifecycle.

  The Skill previously spoke only creation ("set up r-machine", "add an OuterGear"). It now covers how R-Machine projects actually evolve, with two new modes:

  - **Section C — Implement a feature.** Turns a plain request ("a timer with start/stop", "a favorites list") into R-Machine's shape by decomposing it into gears (logic) + shells (localized content) + a React consumer (glue), then dispatches each piece through the existing "add a resource" flow. New `references/decompose.md` holds the forward procedure, a compact placement rubric, and a worked example.
  - **Section D — Modify or evolve.** The mode where R-Machine's "Uniformity Under Change" shows: it locates the resource that owns a behavior via its namespace, edits behind the stable contract, and **reports the blast radius** — implementation-only (zero downstream), additive (new usage only), or breaking (the exact consumers/tests `tsc` names). New `references/modify.md` carries the procedure and worked examples (including a rename that propagates into mocks instead of rotting them).

  To make a generic request (which names no R-Machine terms) reach the Skill, the **initial-setup** flow now writes a minimal, idempotent R-Machine routing stanza into the project's `CLAUDE.md` and `AGENTS.md`, telling an agent to route feature and change work through the Skill.

  It also corrects several setup/consume patterns surfaced by running the Skill against real projects:

  - **Language switcher** now shows the framework-correct plug/import (`ClientPlug` from `client-toolset` in Next, not the bare React `Plug`), and renders locale **autonyms** from a hardcoded map — the placement rule is refined to "no hardcoded **localizable** text", so locale-invariant labels are no longer a false violation.
  - **Nested server components** must not re-bind the locale: only a page/layout binds via `useR(params)`; a nested `ServerPlug` consumer takes no `params` and calls `useR()` bare (inherits the request locale).
  - **Suspense-aware tests**: the first assertion on a `Plug`/`ClientPlug` consumer must be `await findBy*` (the first render is the empty fallback).
  - **Type-name derivation** now covers hyphenated namespaces (`outer/day-counter` → `Outer_Day_Counter`).
  - **Vite/React setup**: the HMR plugin import uses an explicit `.ts` extension (nodenext), a `tsconfig.test.json` (+ its `references` entry) is specified for typed tests, and the `@/` alias uses one consistent idiom across `vite.config.ts` and `vitest.config.ts`.

## 1.0.0-alpha.14

### Patch Changes

- 7c87299: Move module loading off `RMachine.create({ load })` onto `ResourceAtlas.loader`, and split resources into `pub/` (client-safe) and `prv/` (server-only) folders — fixing a security bug where server-only `inner/` gears could leak into the Next.js client bundle.

  - **New loader API.** `ResourceAtlas.loader.register(prefixes, fn)` registers a `(path, options) => Promise<module>` loader for one or more layout prefixes, or `["*"]` as a catch-all (a prefix-specific loader wins over `"*"`). Multiple `register` calls accumulate. The `load` option on `RMachine.create(...)` is **removed**; the config now carries the loader. New error `ERR_NO_LOADER_REGISTERED` when a layout prefix has no matching loader.
  - **`pub/` + `prv/` folders.** Resources live under `pub/` (`base`/`outer`/`vertex`/`shell`) or `prv/` (`inner`), each owning a `loader.ts` whose dynamic-import glob is rooted there. `pub/loader.ts` is imported from `setup.ts`; `prv/loader.ts` is fenced with `import "server-only"` and imported only from `server-toolset.ts`, so the server-only glob never reaches the client bundle. The `pub`/`prv` segment is filesystem-only — atlas namespaces are unchanged (`base/config`, `inner/catalog`). Projects with no server-only resources use `pub/` only and register `["*"]`. `server-setup.ts` is removed.
  - **Build-safe green-field.** Because each glob is rooted at a folder that always contains its `loader.ts`, the bundler context is never empty — scaffolding the folders before adding any resource no longer breaks the first build.

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Update the bundled R-Machine LLM Skill installed by `rforge skill`.

  Ships the comprehensive Skill revision so freshly installed projects get the up-to-date authoring guidance (DirectPlug, plug-attach convention, current OuterGear/BaseGear/InnerGear surface).

## 1.0.0-alpha.12

### Patch Changes

- ec6c1fc: Ground-up rewrite of R-Machine on a single unified primitive.

  This release rebuilds the entire engine around one insight: i18n and dependency
  injection are the same problem — typed, context-dependent resource resolution.
  Everything resolves through one access primitive (`Plug`) over a single resource
  model, so the same machinery powers locale-aware content, shared state, and
  injected services without separate subsystems.

  Because the surface area changed comprehensively, this entry is intentionally
  high-level rather than an exhaustive per-symbol diff. The headline themes:
  - **Unified resource model.** A single entity model (logic+state, content, and
    their fusion) resolved uniformly through `Plug`, with kind-based dependency
    scoping enforced by the type system.
  - **Architectural discipline enforced by the compiler.** Wrong wiring is
    unrepresentable rather than merely flagged; dependency declarations are
    token-based for precise, readable type errors.
  - **Per-locale architecture.** Locales are first-class and fully typed
    end-to-end, delivering zero-cost i18n readiness without per-message runtime
    negotiation.
  - **Next.js App Router integration via routing strategies** (flat / path /
    origin), with proxy-driven locale routing and a request-scoped server model
    that yields SSR's process/request two-tier caching for free.
  - **React adapter** with a per-consumer wire model, state that survives HMR, and
    opt-in React Compiler interop.
  - **`@r-machine/testing`** built on a single uniform test primitive (`mockPlug`)
    that works identically across every entity kind and on React consumers.
  - **`rforge` CLI + LLM Skill** for scaffolding and agent-assisted development,
    treating the Skill as product surface on par with the code.

  Migrating from a previous alpha: treat this as a new baseline. The public API,
  generic signatures, and configuration entry points changed throughout; follow
  the current docs and the `rforge` scaffolds rather than porting old call sites
  mechanically.

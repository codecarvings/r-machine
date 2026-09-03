# R-Machine — Initial project setup (Mode A)

The one-shot mode: turn a project with no R-Machine into one that has a working
`resource-atlas.ts` + `setup.ts`, a type-clean `tsc`, and an agent routing stanza
so later plain feature requests come back to this skill.

This file **orchestrates**; the per-framework detail lives in
[next-setup.md](./next-setup.md), [react-setup.md](./react-setup.md) and
[standalone-setup.md](./standalone-setup.md). Run it once per project — after it,
everything goes through **SKILL.md Section B** (add a resource), **Section C**
(implement a feature) or **Section D** (modify).

---

Read `./next-setup.md` for Next.js App Router projects.
Read `./react-setup.md` for React (Vite) projects.
Read `./standalone-setup.md` for plain Node projects (CLI, queue worker,
cron, template renderer) that consume R-Machine container-free via `DirectPlug`.

## A.1 — Identify the framework / mode

Check what the project has:

- `next.config.*` → **Next.js App Router** → `./next-setup.md`
- `vite.config.*` / `react-scripts` → **React (Vite)** → `./react-setup.md`
- Neither, and it's a plain Node project (CLI, queue worker, cron, template renderer) —
  or the user explicitly wants container-free usage → **Standalone / DirectPlug**
  → `./standalone-setup.md`

If unclear, ask the user.

## A.2 — Gather required information

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
details in `./standalone-setup.md`.)

Don't ask for everything at once if the intent is already clear from the
message.

## A.3 — Generate the files

Follow the framework-specific reference file exactly. Generate all required
files and show them to the user. Explain any placeholder that needs
customisation (real domain names, locale lists, etc.).

## A.4 — Next steps after initial setup

After generating the config files, tell the user:

1. **Install the packages** using the package manager already in the project — see the reference file for the exact command per package manager.
   - **Next.js**: `r-machine`, `@r-machine/react`, `@r-machine/next` (prod) + `@r-machine/testing`, `jiti` (dev — `jiti` powers `createNextDevImport` HMR)
   - **React**: `r-machine`, `@r-machine/react` (prod) + `@r-machine/testing` (dev)
   - **Standalone / Node**: `r-machine` (prod) + `@r-machine/testing` (dev) — no framework packages
2. **Set up tests (default).** Check for an existing test framework
   (`vitest.config.*`, a `vitest` devDependency). If none, propose configuring
   vitest and, if accepted, generate `vitest.config.ts` for the mode + a baseline
   `verifyResourceAtlas` test. R-Machine treats tests as a default, not an extra —
   see `./testing.md`.
3. **Make the kit type-clean (required).** The kit points at `shell/lib/fmt`,
   which doesn't exist yet → the first `tsc` fails with a `never`. Either scaffold
   it as the first resource (`shell(mono)`, `./patterns/shell.md`) and
   register it in the atlas, or remove the `fmt` kit entries. (Per-mode details in
   the setup reference.)
4. **Run the typecheck gate** (`tsc --noEmit`, or the project's `typecheck` /
   `build` script) — must be clean before declaring setup done.
5. From now on, use this skill normally to add gears and shells (**SKILL.md
   Section B**).

## A.5 — Write the agent routing stanza

So that a **later, plain feature request** (which names no R-Machine terms) still
routes through this skill, record that this is an R-Machine project in the agent
instruction files at the project root. The stanza is written **once**, in
`AGENTS.md`; `CLAUDE.md` only points at it.

**1. `AGENTS.md` — the stanza itself.** This is the vendor-neutral file (Claude
Code, Cursor, Codex, Copilot all read it), so it holds the content.

- **Create** it with the stanza if it does not exist; **append** the stanza if it
  does — never overwrite existing content.
- **Append after any managed block.** A generator may own part of the file and
  rewrite it. Next.js is the case you will actually hit: `next dev` re-writes
  everything between `<!-- BEGIN:nextjs-agent-rules -->` and
  `<!-- END:nextjs-agent-rules -->` whenever it detects an agent, so a stanza
  placed inside those markers is silently lost on the next run. Append **after**
  the closing marker.

**2. `CLAUDE.md` — a pointer, not a copy.** Claude Code resolves a bare
`@AGENTS.md` line by inlining that file, so the stanza is never duplicated.
Write exactly this one line (no code fence — an `@` import inside a code block or
code span is **not** resolved):

```md
@AGENTS.md
```

- **Create** `CLAUDE.md` containing just that line if it does not exist;
  **append** the line if the file exists with other content — the import resolves
  anywhere in the file, not only on line 1.
- **Skip `CLAUDE.md` entirely if it is a symlink to `AGENTS.md`** (some projects
  do this) — the two are one file, and writing both would duplicate the stanza.

**Idempotent** — before writing either file, skip it if it already contains an
equivalent R-Machine routing stanza, and skip `CLAUDE.md` if it already imports
`@AGENTS.md`.

The stanza to write into `AGENTS.md`:

```md
## R-Machine project

This project uses **R-Machine**. For any feature, behavior, or UI work — new or a
change to something that already exists — use the `r-machine` skill. Build new
work as **gears** (logic) + **shells** (localized content) + a **React consumer**
(glue); make changes behind the owning resource's namespace and check the blast
radius with `tsc`. Do not hand-roll ad-hoc state or hardcode localizable
user-facing text. See the skill's Section C (implement) and Section D (modify).
```

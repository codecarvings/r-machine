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
2. Locales and default locale — see **Asking for locales** below
3. Path strategy only: proxy or no-proxy?
4. Origin strategy only: the origin map (`{ en: "https://…", it: "https://…" }`)
5. Use a formatter shell (`shell/lib/fmt`)? Recommended — default yes.

(An empty `path-atlas.ts` is created by default for every Next strategy — don't
ask about it.)

For **React**, ask (or infer):

1. Locales and default locale — see **Asking for locales** below
2. Locale persistence: `localStorage`, cookie, or none — equal choices, mark
   none of them as recommended

For **Standalone / Node**, ask (or infer):

1. Locales and default locale — see **Asking for locales** below
2. Which shared resources to expose as `directKit` (e.g. a `shell/lib/fmt`
   formatter)? Optional.

(No strategy, proxy, or origin questions — standalone has no framework. Full
details in `./standalone-setup.md`.)

Don't ask for everything at once if the intent is already clear from the
message.

### Asking for locales

Offer exactly these options, in this order, and **mark none of them as
recommended or default**:

1. **`en` only** — a single locale is a complete setup.
2. **`en` + `it`**, default `en` — multi-locale in one click.
3. **Other** — the user types the locale codes, default first. If your question
   tool already adds a free-text answer, that is this option; do not add a
   duplicate.

With the question, **say that the choice is not permanent**:

- **Locales can be added or removed at any time.** Gears and components never
  depend on the locale list, so neither change touches them. A single-locale
  project has nothing to restructure: content shells are a folder with one file
  per locale from day one.
  - **Add**: extend `locales`, then add one sibling file per content shell
    (`localized(...)`, see `patterns/shell.md`). There is no fallback chain: a
    missing `shell/<name>/<locale>` file is a resolve error, not a fall back to
    the default, and the baseline `verifyResourceAtlas` test names every file
    still missing. With the Next Origin strategy, also add the locale to
    `localeOriginMap`; it is not typed against `locales`, so a missing entry
    only shows at runtime (`No origin defined for locale …`). An absent
    per-locale key in `path-atlas.ts` just leaves that route untranslated.
  - **Remove**: drop it from `locales` (choose a new `defaultLocale` if it was
    the default), then delete its sibling files and its `localeOriginMap` /
    `path-atlas.ts` entries (`tsc` names every leftover `path-atlas.ts` key as
    an unknown locale). If it was the **canonical** locale (the file that
    exports the shell's type), promote a remaining sibling in each content
    shell to the canonical form (`patterns/shell.md`) and point the type import
    in `resource-atlas.ts` at it.

## A.3 — Generate the files

Follow the framework-specific reference file exactly. Generate all required
files and show them to the user. Explain any placeholder that needs
customisation (real domain names, locale lists, etc.).

**Say here that setup also touches the agent instruction files.** The routing
stanza (A.5) is part of setup, not an extra — but a user who did not expect
`AGENTS.md` / `CLAUDE.md` to change reads it as the skill editing files behind
their back. Announce it alongside the generated files, in one short passage:

```text
Setup also appends a short R-Machine routing stanza to AGENTS.md, and the line
@AGENTS.md to CLAUDE.md. That stanza is what makes a later plain request ("add a
timer") come back to this skill instead of being hand-rolled. Both writes are
append-only — nothing you already have is overwritten.
```

This is an **opt-out point, not a gate**: state it and carry on with A.4. Skip
A.5 only if the user objects. Do not turn it into a yes/no question — the user
cannot yet know what the stanza is for, and a "no" here silently costs them the
routing they just asked for.

## A.4 — Next steps after initial setup

After generating the config files, tell the user:

1. **Install the packages** using the package manager already in the project — see the reference file for the exact command per package manager.
   - **Next.js**: `r-machine`, `@r-machine/react`, `@r-machine/next` (prod) + `@r-machine/testing`, `jiti` (dev — `jiti` powers `createNextDevImport` HMR)
   - **React**: `r-machine`, `@r-machine/react` (prod) + `@r-machine/testing` (dev)
   - **Standalone / Node**: `r-machine` (prod) + `@r-machine/testing` (dev) — no framework packages
2. **Set up tests — strongly recommended.** Check for an existing test framework
   (`vitest.config.*`, a `vitest` devDependency). If none, propose configuring
   vitest and, if accepted, generate `vitest.config.ts` for the mode + a baseline
   `verifyResourceAtlas` test. **Mark it as recommended**, with its
   reason in one line: `mockPlug` mocks are typed, so a
   changed resource makes its tests fail to compile instead of passing green,
   and `verifyResourceAtlas` catches every missing resource or locale file
   before runtime. R-Machine treats tests as a default, not an extra — see
   `./testing.md`.

   **If the project lints with ESLint, offer the `^_` ignore pattern.** Many mock
   scopes bind a disposable they never read (`using _ctrl = mockPlug(...)` — the
   binding exists so `Symbol.dispose` runs at end of scope). A stock
   `create-next-app` config does not ignore `^_`, so every such test reports
   `'_ctrl' is assigned a value but never used`: correct code, complaining linter.
   The fix is one option in `eslint.config.mjs` —

   ```js
   rules: {
     "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
   }
   ```

   `varsIgnorePattern` is the only one this needs: `using _ctrl = …` is a variable
   declaration, which is why the warning reads _"assigned a value but never
   used"_. Do not bundle in `argsIgnorePattern` / `caughtErrorsIgnorePattern` —
   they cover unused parameters and `catch` bindings, which R-Machine's pattern
   never produces, so proposing them widens the project's lint policy beyond what
   was asked. If the rule is **already** configured, add the option to the existing
   object rather than replacing it.

   **Offer it, do not write it.** A lint config is project-wide policy the user may
   have curated, and in some projects a warning fails CI — this is the same
   treatment as the `@/` alias, not the same as the files setup owns. Say what the
   warnings will be and why, and let them decide.

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

You already announced this in A.3 — **write it, don't ask again**. Asking twice
turns a disclosed step into a negotiation. (Outside Mode A it is the reverse: on
a project that is already set up, the user's request was a feature, not project
configuration, so the stanza is _offered_ — see SKILL.md Section C step 5.)

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

**3. Report what you wrote.** List the two files in the setup summary next to the
generated ones, with the reason and the way out, e.g. "Appended the R-Machine
routing stanza to `AGENTS.md` and `@AGENTS.md` to `CLAUDE.md`, so later plain
feature requests route through the skill — delete the stanza to opt out." Name
whichever file you skipped and why (already had the stanza, symlink, user
declined). The user must never discover these edits from a diff.

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

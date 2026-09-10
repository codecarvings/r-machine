---
"rforge": patch
---

Extend the bundled R-Machine Skill from scaffolding-only to the full change lifecycle.

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

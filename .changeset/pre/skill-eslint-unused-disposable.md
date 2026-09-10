---
"rforge": patch
---

Skill: explain the `_ctrl` convention, and surface the ESLint rule a stock Next scaffold needs.

Several mock scopes bind a disposable they never read — `using _ctrl = mockPlug(...)`, where the binding exists only so `Symbol.dispose` runs at the end of the block. The skill already wrote `_ctrl` in exactly those places and plain `ctrl` where the value is used, but never said why, so the convention read as arbitrary. `references/testing.md` now states it: correct code that looks unused, given the `_` prefix so linters and readers both see the intent.

On a freshly scaffolded `create-next-app`, that convention produces five `'_ctrl' is assigned a value but never used` warnings, because the stock config does not ignore `^_`. `references/setup.md` A.4 now covers it in the test-setup step, with the one `@typescript-eslint/no-unused-vars` option to add (`varsIgnorePattern`, and only that one — the args and caught-errors patterns cover constructs R-Machine never emits) — and instructs the model to **offer** it rather than write it, the same treatment as the `@/` alias: a lint config is project-wide policy the user may have curated, and in some projects a warning fails CI.

This class of friction is invisible from inside the repo: the example apps use Biome and carry no ESLint config at all, so nothing here exercises the toolchain a real consumer gets from `create-next-app`.

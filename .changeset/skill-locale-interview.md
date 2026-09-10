---
"rforge": patch
---

Skill: give the setup interview fixed locale options, make clear the locale list can change at any time, and cover the single-locale project.

`references/setup.md` now carries an **Asking for locales** section with three options, in order and none marked as recommended: **`en` only**, **`en` + `it`** (default `en`), and **Other** (the user types the codes, default first). Every answer is a complete, valid locale list, so a question tool with preset choices never ends without a code — earlier attempts to ask for locales openly left setups without a `setup.ts`. The question must also say that the choice is not permanent: locales can be added or removed later without touching gears or components.

- **Add**: extend `locales`, add one sibling file per content shell. There is no fallback chain, so a missing `shell/<name>/<locale>` file is a resolve error, and the baseline `verifyResourceAtlas` test names every file still missing. The Next Origin strategy also needs a `localeOriginMap` entry, which is not typed against `locales` and otherwise fails only at runtime.
- **Remove**: shrink `locales` (and `defaultLocale` if needed), delete the locale's files and its origin / path-atlas entries. Removing the canonical locale also means promoting a remaining sibling to the type-exporting form and repointing the `resource-atlas.ts` import.

The per-framework references (`next-setup.md`, `react-setup.md`, `standalone-setup.md`) still asked for "Locales — e.g. `["en", "it"]`" on their own, contradicting that section; they now point at it. The Next Flat and Origin `setup.ts` templates also gain the `← replace with real locales` / `← replace with real default` markers the Path and React templates already had.

For React, locale persistence (`localStorage`, cookie, none) is now presented as three equal choices. The references called `localStorage` the "default", and agents turned that into a "Recommended" option with no reason behind it.

The test scaffolding question goes the other way: it is now marked as strongly recommended, with a one-line reason (typed `mockPlug` mocks fail to compile when a resource changes, and `verifyResourceAtlas` catches missing resource or locale files before runtime).

Separately, the file-path rule said "for **multi-locale** shells the canonical file is `en.tsx`", which leaves a single-locale project to guess — and the plausible guess, `shell/product.tsx`, does not resolve. SKILL.md Step 3 and `references/patterns/shell.md` now state that a content shell is always a per-locale folder, single-locale projects included; `shell(mono)` remains the only single-file shell family.

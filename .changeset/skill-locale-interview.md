---
"rforge": patch
---

Skill: stop the setup interview from recommending a locale list, and cover the single-locale project.

The setup reference asked for "Locales (e.g. `["en", "it"]`) and default locale" and said nothing else. An implementing model reads the example as a default: a real Next setup run turned it into a multiple-choice question with **`en + it` pre-selected as "Recommended"**, justified by an invented rationale ("exercises the localization machinery so shells are meaningful from day one"). Nothing in the skill authorised that. The locale list is business data the project owner has — it is not inferable, and the `["en", "it"]` shape appears throughout the references only because every example app in the repo happens to be bilingual.

The recommendation also had a real, permanent cost. A content shell resolves to `shell/<name>/<locale>` with **no fallback chain**, so a second locale means one more sibling file per content shell forever, and a missing locale file is a resolve error rather than a silent fall back to the default. Pushing an undecided user to two locales up front also inverts the point of the shell boundary: a single-locale project already has the architecture right, and adding a locale later is additive (extend `locales`, add one sibling file per shell — gears, components, `resource-atlas.ts` and `path-atlas.ts` are untouched).

`references/setup.md` now carries an **Asking for locales** section that all three framework question lists point at: never propose a locale list or dress project-specific business data as a "recommended" option, treat a single locale as a first-class answer, and state the real per-locale cost only when the user is undecided.

Separately, the file-path rule said "for **multi-locale** shells the canonical file is `en.tsx`", which leaves a single-locale project to guess — and the plausible guess, `shell/product.tsx`, does not resolve. SKILL.md Step 3 and `references/patterns/shell.md` now state that a content shell is always a per-locale folder, single-locale projects included; `shell(mono)` remains the only single-file shell family.

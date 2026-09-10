---
"rforge": patch
---

Skill: Next.js and React setups always create the formatter shell `shell/lib/fmt`, without asking.

The references disagreed: `references/setup.md` listed the formatter as a question with "default yes", while `references/next-setup.md` and `references/react-setup.md` asked whether the project needed one. Agents resolved the conflict differently from run to run — some asked, some silently applied the default. A formatter is useful in every project and costs nothing to have, so it is no longer a question: setup.md A.2 and both framework references now say it is created by default, next to the empty `path-atlas.ts`.

The opt-out branches are gone too — "No formatter? Drop the `fmt` import", the `// remove if not using a formatter shell` comments in every generated `setup.ts`, and the "or remove the `fmt` entries" alternative in the type-clean step, which now says to scaffold the formatter as the first resource and never to remove the kit entries to make `tsc` pass. The file checklists list `pub/shell/lib/fmt.ts`.

Standalone is unchanged: `directKit` stays optional there.

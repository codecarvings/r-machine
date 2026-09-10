---
"rforge": patch
---

Skill: make the list-form vs map-form dep declaration a decidable rule instead of a scattered rule of thumb.

Both forms are accepted everywhere — every gear family, `Shell`, and every consumer plug — so the compiler never corrects a wrong choice. The Skill's only guidance was two passing remarks in two different pattern files ("map form for three or more deps (survives renames better)" in `outer.md`, "clearer beyond two deps" in `consume/plug.md`), neither of them in `SKILL.md` nor in `plugin-context.md` — the file `SKILL.md` names as the cross-cutting authority on the subject, and which covered only the *consequences* of the form (plugin shape, kit access). No file under `references/patterns/consume/` linked to it at all.

### Changed

- `references/patterns/plugin-context.md` — new "Choosing the form" section stating the rule (**up to 2 deps: list form; from 3 up: map form**, decided by counting), followed by "What follows from the choice": kit hoisting (a runtime error, not a type error, when confused), `mockPlug` override keys (by name in map form, by index in list form), and rename resilience.
- `references/patterns/outer.md`, `references/patterns/consume/plug.md` — the two rules of thumb become pointers to that section, and their map-form examples grow to 3 deps (both previously demonstrated the map form with 2, contradicting the rule they stated).
- `references/patterns/consume/client-plug.md`, `server-plug.md` — their "list/map form" notes now carry the threshold and link to `plugin-context.md`.
- `SKILL.md` — the cross-cutting pointer states the rule inline, so the router sees it without loading the file.
- `references/patterns/shell.md`, `references/concepts/dep-asymmetry.md`, `references/testing.md` — examples aligned to the rule; the `res.perLocale` dep in `dep-asymmetry.md` moves to the list form (`DepHandleList` accepts a `ShellResolverHandle`, so the threshold has no mechanical exception).

Outside the package, `docs/llms-full.txt` §4.1 now states the same threshold as a **suggested convention** (the reference doc describes the API rather than instructing an implementer), and its §10.1 call-shape examples were rebalanced to illustrate it.

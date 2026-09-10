---
"rforge": patch
---

Stop the Skill from predicting blast-radius file counts, and document how a multi-locale shell evolves.

`modify.md`'s worked example C ("add a pause button to the timer") reported _"Additive across 3 files"_ — the only numeric claim the Skill made about the property it sells, and wrong in the flattering direction. A multi-locale shell is one file per locale: `localized()` validates each variant against the canonical type at exact keys in both directions, so adding two labels to `en.tsx` breaks the compile of every sibling. The real count is `2 + N` for N locales, not 3.

The fix is not better arithmetic. The three worked reports differ in where their numbers come from: A states the file it just edited, B reads _"tsc flagged 2 consumers + 1 test"_ off the compiler, and only C had the agent **predict** a total. So `modify.md` now says to report what `tsc` named and never to predict a count — the kind of change is the agent's to state, the numbers are the compiler's. That removes the whole class of error instead of correcting one instance, and keeps the finding that was actually convincing.

Separately — and independent of any reporting — the Skill never said that a new shell member must be added to **every** locale file. An agent that added it only to the canonical one left the project not compiling, with nothing in the docs pointing at the variants. `patterns/shell.md` gains an "Evolving a multi-locale shell" section: the walk (canonical first, it owns the type, then each variant `tsc` names), the verbatim TS2345 error as the work list, and the fact that no partial-variant or fallback mode exists by design, so a half-translated shell cannot reach production.

Verified against `examples/next`: adding two members to the canonical `shell/cart` produced exactly the documented error on the `it` variant.

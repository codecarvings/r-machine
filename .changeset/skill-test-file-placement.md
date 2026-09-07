---
"rforge": patch
---

Skill: state the test file's own path in every "Test it" snippet.

The mirror rule (`src/<path>.ext` → `tests/<path>.test.ts(x)`) was stated in `references/testing.md` and in SKILL.md's Step 6, but nowhere in the pattern files — where the agent actually writes the test. Their source snippets all carry a `// src/…` header while the test snippets carried none, and the consumer ones imported the unit relatively (`./cart-button`, `./product-page`, `./render`), which reads as an instruction to colocate the test with its source.

### Changed

- `references/patterns/{base,inner,outer,shell}.md` — each "Test it" snippet opens with its own `// tests/…` path; the two shell snippets also restate that a multi-locale shell gets one test named after the folder, not one per locale.
- `references/patterns/vertex.md` — has no snippet, so the path is spelled out in prose.
- `references/patterns/consume/{plug,server-plug,direct-plug}.md` — path header added and the relative import replaced with the `@/…` alias the test would actually use from `tests/`.

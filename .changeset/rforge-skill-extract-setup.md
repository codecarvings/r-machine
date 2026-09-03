---
"rforge": patch
---

Move the one-shot setup procedure out of `SKILL.md` into `references/setup.md`.

Section A (initial project setup) was the last cold-path section still inlined in `SKILL.md`: 130 lines / ~5.9 KB that loaded on **every** skill invocation, for a procedure that runs **once per project**. Sections C and D were already thin routers into `references/`, and the per-framework setup detail already lived in `references/{next,react,standalone}-setup.md` — only the orchestration was still inline.

`SKILL.md` drops from 532 to 406 lines (26.3 KB → 20.6 KB, −23%), so the common paths — add a resource (B), implement a feature (C), modify (D) — no longer carry the setup instructions. Step 0 routes to the new file instead, and the cross-references in `testing.md` and `next-setup.md` point at it.

Section B stays inline deliberately: it is the hot path, and moving it would add a file read to the most frequent operation.

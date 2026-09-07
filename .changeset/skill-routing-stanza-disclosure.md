---
"rforge": patch
---

Disclose the `AGENTS.md` / `CLAUDE.md` routing-stanza write before making it, instead of after.

Initial setup (Mode A) writes an R-Machine routing stanza into the project's agent instruction files — that stanza is what makes a later plain request ("add a timer") route back through the skill. It is a legitimate part of setup, but a user who did not expect those two files to change reads it as the skill editing files behind their back.

### Changed

- **A.3** now announces the write alongside the generated files: which two files are touched, why, and that both writes are append-only. It is an opt-out point, not a gate — the skill states it and carries on, and skips A.5 only if the user objects. Turning it into a yes/no question is explicitly ruled out: at that moment the user cannot yet know what the stanza is for, and a "no" silently costs them the routing they just asked for.
- **A.5** gains a reporting step: the two files are listed in the setup summary next to the generated ones, with the reason and the way out, plus whichever file was skipped and why.
- **Section C step 5** (the retrofit fallback on an already-set-up project) is sharpened in the opposite direction: there the request was a feature, so touching agent instruction files is outside it — ask, and wait for a yes.

---
"rforge": patch
---

Fix what the Skill says happens when `@r-machine/testing` and `r-machine` resolve to two module instances.

The gotcha claimed that without `server: { deps: { inline: … } }` the mocks "silently do nothing" — green tests verifying nothing. That is no longer true: `mockPlug` reads the plug's head symbol at entry and throws `ERR_MOCK_TARGET_INVALID` when it is missing, which is exactly the two-instance condition. The failure is loud, immediate, and hits **every** `mockPlug` call in the suite.

The real defect was the diagnosis, and it was broken in both directions. The Skill named `ERR_MOCK_TARGET_INVALID` in four places and attributed it to two causes — a plain-object resource, or a consumer missing its `Fn.plug` line — never to the module-instance split, which raises the same error. So an agent hitting it would search the Skill, find "you forgot `.plug`", and go re-add a line that was already there. Meanwhile the `deps.inline` bullet described a symptom nobody would ever observe.

`testing.md` now states the actual symptom (every mock failing at once, with a message about the target, is a config problem rather than a target problem) and adds a three-cause triage for `ERR_MOCK_TARGET_INVALID` ordered by how it presents: all mocks failing → module instances; one resource → plain object, no plug; one consumer → missing `.plug`. The generated vitest config comment names the error too, so the line is not removed as boilerplate.

The underlying cause — plug internals hanging off module-local `Symbol()` rather than `Symbol.for()` — is left alone deliberately; making `deps.inline` unnecessary is a design decision for a future version, not a docs fix.

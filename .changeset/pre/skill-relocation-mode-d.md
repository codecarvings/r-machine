---
"rforge": patch
---

Skill: document the fourth kind of Mode D change — moving a resource to another family.

`references/modify.md` classified a change three ways — implementation-only, additive, breaking — and all three describe a change to the **Surface**. Moving a resource between families (`outer/counter` → `vertex/counter`, the usual answer to "let this component appear several times on the page") is a fourth, orthogonal case: the Surface is identical and the resource's *address* changes. It was not covered anywhere; `patterns/atlas-update.md` only adds and removes slots. A model asked to do it deduced the steps by hand.

It is also the sharpest demonstration of Uniformity Under Change in the skill, because `outer` and `vertex` share a composer: the gear body is not touched at all. A new **Worked example D** documents it, including the parts that are not deducible from a successful run:

- **Two blocking preconditions.** A vertex may not be a dep of any resource, and is not valid in a consumer `kit` / `clientKit`. Either one turns the move from a relocation into a refactor.
- **A step `tsc` does not check.** The layout entry is compiler-verified through the atlas self-check, but the loader prefix registration is not — omitting it fails at runtime with `ERR_NO_LOADER_REGISTERED`, not at build time.
- **A semantic change the compiler cannot see.** `gear:outer` is one shared instance per `(namespace, locale)`; `gear:outer(vertex)` is one per consumer. Pre-existing consumers that relied on shared state silently stop sharing — `<VertexFrame>` is the remedy when sharing was intended, and the skill now says to ask rather than assume.
- **The cheapness does not generalise.** Only `outer` ↔ `vertex` leaves the body untouched; `base` ↔ `inner` swaps the composer and crosses the `pub/` / `prv/` fence, and `shell` ↔ `shell(mono)` converts between a per-locale folder and a single file.

SKILL.md Section D gains the fourth classification and its report phrasing, and the Step 0 router lists a family move among the requests that reach Mode D.

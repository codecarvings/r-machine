---
"rforge": patch
---

Skill: document the array/type asymmetry in the deep-partial merge law.

The merge only descends into plain objects, so an array-valued key is written whole — but `DeepPartial<T[]>` distributes into the elements, which means an array of *partial* elements typechecks while the runtime replaces the array with exactly that. State ends up violating its own type with no error from either side. This is the one place where the compiler does not back the model up, so the Skill now says so explicitly instead of leaving it to be inferred.

### Changed

- `references/patterns/outer.md` — the "only plain objects merge" rule now spells out the type/runtime disagreement, with the `{ lines: [{ qty: 1 }] }` case that compiles and corrupts, and states that an array in an action fragment, a `ctrl.state` seed or a mock override is always a whole-array write.
- `references/testing.md` — the resolution-override section now links the four merge rules in `outer.md` rather than only asserting "the same merge law", and the degradation note reads "any non-plain-object leaf" instead of "primitive leaves", which implied arrays merged element-wise. The `ctrl.state` seeding note gained the same caveat.

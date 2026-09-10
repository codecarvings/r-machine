---
"rforge": patch
---

Skill: make the `_.getter` vs `_.cell` choice decidable instead of a judgement call.

The two are interchangeable at the type level — both return `Getter<V>` — so a wrong choice is invisible to the compiler and to tests. The Skill's only guidance was a rule of thumb keyed on "a derived value **many components read**", which is a fact about the resource's future consumers: the agent writing the gear cannot evaluate it, so the choice fell back to judgement. The three criteria that *are* answerable from the member body and the state shape were missing.

### Changed

- `references/concepts/reactivity.md` — new "Choosing between them" section: `_.getter` is now stated as the explicit default (a subscribed cell is **eager** — it recomputes on every state change to decide whether to notify — and carries its own graph node), with `_.cell` gated on a closed list of three triggers (the body allocates; a non-trivial computation over a collection; the output stays `Object.is`-unchanged while the state changes often) and two cases where a cell is actively wrong (direct projection of a single-field state; an expensive allocating body, whose fresh reference means `Object.is` is never true and the cell never suppresses a notification).
- `references/patterns/outer.md` — the `_.cell` section leads with the default/exception framing instead of "use it for derived values that many components read", and names why the cart example splits `lines` (getter) from `itemCount`/`subtotal` (cells).
- `references/decompose.md` — the single "a value derived from state" row, which presented the two as interchangeable during decomposition, is split into a direct-projection row (`_.getter`) and a derived row (`_.cell`).

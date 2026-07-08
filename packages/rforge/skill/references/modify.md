# R-Machine — Modify or evolve (Mode D)

The mode where R-Machine earns its tagline, **Uniformity Under Change**. A
namespace is a **stable contract**; the implementation behind it is the
**volatile layer**. Consumers — including tests, mocks, and fixtures — depend on
the namespace, not on where a value lives or how it is shaped. So the real
question on any change is not "can it do X?" but **"how many files must change
when X evolves?"** — and the answer is usually "one".

This file makes that operational: **locate → classify the change → edit behind
the namespace → run `tsc` → report the blast radius**. It edits existing
resources; to add a genuinely new one it dispatches to **SKILL.md Section B**.

---

## Procedure

1. **Locate the owner.** Every behavior/content has exactly one owning resource.
   Map the request to a namespace, then read `resource-atlas.ts` to find its file
   (`pub/<family>/<name>.ts` or `pub/shell/<name>/<locale>.tsx`,
   `prv/inner/<name>.ts`). For a **feature-level** change spanning several
   resources, decompose the _change_ the same way Mode C decomposes a feature —
   use the rubric in [decompose.md](./decompose.md) to find every affected owner.

2. **Classify the change** (this decides the blast radius — see next section):
   implementation-only, additive, or breaking.

3. **Edit behind the namespace.** Change the factory body / state / members in
   place. Keep the **Surface** (the public shape consumers see) stable unless the
   contract genuinely must change. Adding a new resource instead? → Section B.
   Adding/removing an atlas slot? → [patterns/atlas-update.md](./patterns/atlas-update.md).

4. **Run the typecheck gate** (`tsc --noEmit`, or the project's `typecheck`).
   The compiler is the oracle: it lists **exactly** the consumers/tests a contract
   change touches — nothing more, and never silently less.

5. **Report the blast radius** to the user, explicitly (see below). This is the
   point of the mode — make the property visible, don't leave it implicit.

---

## The three kinds of change (and their blast radius)

| Change                  | What you did                                  | Blast radius                                                                                                                                                                 |
| ----------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Implementation-only** | Rewrote the body; Surface unchanged           | **Zero.** One file. Consumers, tests, and mocks don't notice — they depend on the namespace, which is unchanged.                                                             |
| **Additive**            | Added a new member to the Surface             | **New usage only.** Existing consumers still typecheck untouched; only code that wants the new member changes.                                                               |
| **Breaking**            | Renamed / removed / re-typed a Surface member | **Exactly the dependents** `tsc` names. The mock/fixture layer breaks too — because it tracks the same contract — so a rename propagates into tests instead of rotting them. |

Always **say which kind it was** in the summary: _"Surface unchanged → nothing
downstream"_, _"added `pause` → only the new button reads it"_, or _"renamed
`add`→`addItem` → tsc flagged 2 consumers + 1 test, all updated"_.

---

## Worked example A — implementation-only (zero blast radius)

> "Make the timer count down from 60 instead of up."

Locate `outer/timer`. Change the body — `elapsed` seeding + the tick direction —
but keep the Surface (`running`, `elapsed`, `display`, `start`, `stop`) identical:

```ts
// pub/outer/timer.ts — body change only
const tick = _.action(() => ({ elapsed: Math.max(0, $.state.elapsed - 1) }));
// withState({ running: false, elapsed: 60 })  ← seed changes; members do not
```

`tsc` clean, no consumer touched. **Report:** _"Surface unchanged → the `<Timer>`
component and its test are unaffected; one file changed."_

---

## Worked example B — breaking change (compiler-guided propagation)

> "Rename `cart.add` to `cart.addItem`."

Locate `outer/cart`, rename the member on the Surface:

```ts
// pub/outer/cart.ts
addItem: _.action((l: Line) => ({ lines: [...$.state.lines, l] })), // was: add
```

Run `tsc`. It names every dependent — the consumer and the test both fail on
`.add`:

```tsx
// components/cart-button.tsx     → cart.addItem("item-1")   (was cart.add)
// cart-button.test.tsx           → the mocked call updates to addItem
```

Fix exactly those. **Report:** _"Contract change: `add`→`addItem`. tsc flagged 2
sites (1 consumer, 1 test); both updated. Nothing else in the codebase references
the old name."_ (This is the rename-propagates-into-mocks property — the test
layer moves _with_ the contract instead of breaking silently.)

---

## Worked example C — evolve a feature (multi-resource change)

> "Add a pause button to the timer."

Decompose the _change_ (rubric in [decompose.md](./decompose.md)): the state +
behavior belong to `outer/timer`, the label to `shell/timer`, the button to the
component. Each is a **modify**, one is **additive**:

```
outer/timer   modify — additive: + paused state, + pause()/resume() actions
shell/timer   modify — additive: + "pause" / "resume" labels
<Timer>       modify — read the new members, render the button
```

Because the gear/shell changes are **additive**, nothing that already consumed
`outer/timer` breaks — only `<Timer>`, which opts into the new members, changes.
**Report:** _"Additive across 3 files; existing consumers of the timer untouched."_

---

Ports/state changes are substitutable in tests via `mockPlug`
([testing.md](./testing.md)); to retire a resource entirely, remove its file and
its atlas slot ([patterns/atlas-update.md](./patterns/atlas-update.md)) and let
`tsc` surface any lingering consumer.

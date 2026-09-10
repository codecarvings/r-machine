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
   implementation-only, additive, breaking, or relocation.

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

## The kinds of change (and their blast radius)

| Change                  | What you did                                                        | Blast radius                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Implementation-only** | Rewrote the body; Surface unchanged                                 | **Zero.** One file. Consumers, tests, and mocks don't notice — they depend on the namespace, which is unchanged.                                                                                                         |
| **Additive**            | Added a new member to the Surface                                   | **New usage only.** Existing consumers still typecheck untouched; only code that wants the new member changes.                                                                                                           |
| **Breaking**            | Renamed / removed / re-typed a Surface member                       | **Exactly the dependents** `tsc` names. The mock/fixture layer breaks too — because it tracks the same contract — so a rename propagates into tests instead of rotting them.                                             |
| **Relocation**          | Moved the resource to another family / namespace; Surface identical | **The consumers `tsc` names, plus the registration.** The body does not change — the address does. One step is runtime-only, and a family change can carry a semantic change the compiler cannot see (worked example D). |

The first three classify a change to the **Surface**; **relocation** is
orthogonal — the Surface is identical and the resource's _address_ moves.

Always **say which kind it was** in the summary: _"Surface unchanged → nothing
downstream"_, _"added `pause` → only the new button reads it"_, or _"renamed
`add`→`addItem` → tsc flagged 2 consumers + 1 test, all updated"_.

**Report what `tsc` named — never predict a file count.** The kind of change is
yours to state; the numbers are the compiler's. "tsc flagged 2 consumers + 1
test" is a finding; "additive across 3 files" is a guess, and it is usually low —
a multi-locale shell alone is one file per locale (see
[patterns/shell.md](./patterns/shell.md#evolving-a-multi-locale-shell)).

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
              ↳ every locale variant, not just the canonical file
<Timer>       modify — read the new members, render the button
```

Because the gear/shell changes are **additive**, nothing that already _consumed_
`outer/timer` breaks — only `<Timer>`, which opts into the new members, changes.
The locale variants are not consumers: they co-author `shell/timer`, so each one
needs the two new labels before the project compiles again — `tsc` names them.
**Report:** _"Additive: no existing consumer of the timer changed. tsc named the
locale variants still missing the new labels; all updated."_

---

## Worked example D — relocation: change a resource's family

> "Make this component usable several times on the same page."

The component reads `outer/counter`. A `gear:outer` resource is **one shared
instance** per `(namespace, locale)`, so every copy of the component shows the
same value. The fix is a family change: `outer/counter` → `vertex/counter`. A
vertex gear has the same composer and the same Surface — it is the _layout entry_
that gives each consumer its own instance.

This is the clearest demonstration of Uniformity Under Change in the skill: **the
gear body is not touched at all.**

**First, two preconditions that can block the move** — check them before editing:

- **A vertex may not be a dep of anything.** If any gear or shell lists
  `outer/counter` in `withDeps`, the conversion cannot proceed until that
  dependency is resolved another way. Report it and ask; do not work around it.
- **A vertex is not valid in a consumer kit.** If the namespace appears in `kit` /
  `clientKit`, remove it there — it stays reachable as an ordinary plug dep.

(Both rules: [concepts/dep-asymmetry.md](./concepts/dep-asymmetry.md).)

**Then the move:**

1. **Layout + loader.** `defineLayout` needs `"vertex/": "gear:outer(vertex)"`,
   and the `vertex/` prefix needs a `ResourceAtlas.loader.register([…])` entry.
   The layout entry is compiler-checked — an atlas key with no matching prefix
   fails to compile. **The loader prefix is not**: omit it and the resource fails
   at runtime with `ERR_NO_LOADER_REGISTERED`. This is the one step `tsc` will not
   catch for you.
2. **Move the file** — `pub/outer/counter.ts` → `pub/vertex/counter.ts`. The
   contents do not change: it still imports and calls `OuterGear`.
3. **Rename the exported type** — `Outer_Counter` → `Vertex_Counter` (the naming
   convention in SKILL.md Step 3).
4. **Update `resource-atlas.ts`** — the import path and the `ResourceMap` key
   (`"outer/counter"` → `"vertex/counter"`).
5. **Update the consumers** — `Plug("outer/counter")` → `Plug("vertex/counter")`.
6. **Move the test** to mirror the new source path
   (`tests/r-machine/pub/vertex/counter.test.ts`). Its assertions do not change;
   only the import of `r` follows the file.

**Then say what the compiler cannot.** `tsc` verifies every step above except the
loader prefix — but it cannot see the thing that actually changed: `outer/` is
**one shared instance**, `vertex/` is **one per consumer**. A consumer that
already existed and relied on the shared state now gets its own. If some subtree
must keep sharing, wrap it in `<VertexFrame gear={instance}>`
([patterns/vertex.md](./patterns/vertex.md)) — and when it is not obvious which
consumers wanted sharing, ask instead of assuming.

**Report:** _"Relocation: `outer/counter` → `vertex/counter`. The gear body is
unchanged — only its address and its registration moved. tsc flagged 2 consumers
plus the atlas; the test moved with the file. Behavior change: each consumer now
has its own counter instead of one shared one."_

**Only `outer` ↔ `vertex` is this cheap.** Those two families share a composer, so
the body survives untouched. Other family changes rewrite the file: `base` ↔
`inner` swaps the composer (`BaseGear` / `InnerGear`) and crosses the `pub/` /
`prv/` fence, and `shell` ↔ `shell(mono)` converts between a folder of per-locale
files and a single locale-agnostic one.

---

Ports/state changes are substitutable in tests via `mockPlug`
([testing.md](./testing.md)); to retire a resource entirely, remove its file and
its atlas slot ([patterns/atlas-update.md](./patterns/atlas-update.md)) and let
`tsc` surface any lingering consumer.

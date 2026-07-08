# R-Machine — Decompose a feature (Mode C)

The high-level router. Turn a plain feature request ("a timer with start/stop
buttons") into R-Machine's predictable shape — **logic → gears, localized
content → shells, glue → a React consumer** — then hand each piece to
**SKILL.md Section B**, which writes it.

This file **plans**; it does not create. It produces a short resource list,
confirms it, and dispatches. No new syntax lives here — the
[patterns/](./patterns/) files own that; never inline a template you can point
to.

---

## Procedure

1. **Split the feature into three buckets** (any may be empty):
   - **Logic** — state, behavior, computations, server/data access.
   - **Localized content** — any user-facing text: labels, messages, formats.
   - **Glue** — the React component(s) that render content and drive logic.

2. **Classify each logic/content part** with the rubric below into a resource
   kind, a namespace, and a one-line shape.

3. **Emit the plan** — a list the user can scan at a glance:

   ```
   outer/timer   gear:outer (state: running, elapsed; actions: start/stop; cell: display)
   shell/timer   shell (labels: start, stop)
   <Timer>       React consumer — Plug("outer/timer", "shell/timer")
   ```

   State any assumption you had to make (see **When in doubt**).

4. **Confirm** in one short exchange, then **dispatch**:
   - Each resource → run **SKILL.md Section B (Step 1 →)**, picking the pattern
     file by family ([patterns/outer.md](./patterns/outer.md),
     [patterns/shell.md](./patterns/shell.md), …).
   - The component → the matching [patterns/consume/](./patterns/consume/) file
     for the project's plug (`Plug` / `ClientPlug` / `ServerPlug` / `DirectPlug`).

Section B stays the execution engine; Mode C only decides **what** and **where**.

---

## Placement rubric

Classify each part; take the first row that fits.

| The part is…                                                             | Make it a…                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| user-facing text / labels / messages (translatable)                      | `shell` (`pub/shell/<name>/<locale>.tsx`)                    |
| locale-aware behavior, no translations (currency/date formatter, parser) | `shell(mono)` (`pub/shell/lib/<name>.ts`)                    |
| reactive/stateful, used across the React tree                            | `gear:outer` with `withState`                                |
| reactive state local to one component + its descendants                  | `gear:outer(vertex)` (inside `<VertexFrame>`)                |
| stateless service used by other gears (never by shells)                  | `gear:base`                                                  |
| server-only work (DB, secret, private API)                               | `gear:inner` (`prv/inner/`, `ServerPlug`-only)               |
| a side effect that fires when state changes                              | `_.relay` inside the owning outer gear                       |
| a value derived from state                                               | `_.getter` (or `_.cell` for memoized / fine-grained)         |
| an external fn / server action / SDK / fetch                             | a **port** — `.withPorts({ name })`, read via `$.ports.name` |

Plain, non-locale-aware code (a `mm:ss` formatter, a math helper) is **not** a
resource — it's an ordinary module function. The valid dep families per kind live
in SKILL.md Step 1; the why is in
[concepts/dep-asymmetry.md](./concepts/dep-asymmetry.md).

---

## When in doubt (defaults + escape hatches)

R-Machine's structure is deterministic, but splitting a feature still takes
judgment. Prefer a safe default, **state the assumption in the plan**, and let
`tsc` catch a wrong call rather than stalling on a question:

- **Is a string localizable, or locale-invariant?** → default to a **shell** for
  any user-facing text that **changes per locale**; inlining one later is cheaper
  than retrofitting i18n. Keep hardcoded only text that is **locale-invariant by
  nature** — a language switcher's autonyms (`English`, `Italiano`), a brand name,
  a dev/debug label.
- **One instance or many independent ones?** → default to one **`gear:outer`**
  (application-scope state). Reach for **`gear:outer(vertex)`** only when the user
  confirms multiple independent copies on a page (e.g. a timer per table row).
- **Logic vs content boundary?** → a gear carries no `$.locale` and no text; a
  shell carries no state. If a part has both, split it: state → gear, labels →
  shell, and the component unites them.
- **Still ambiguous?** → pick the default above, **say so**, and proceed. A wrong
  guess surfaces as a type error (compiler-as-oracle), which is cheaper to fix
  than a stalled conversation.

---

## Worked example — "a timer with start/stop buttons"

**Split** → _Logic_: running flag, elapsed seconds, start/stop, a formatted
display. _Content_: the "Start"/"Stop" labels (a shell). The `mm:ss` format is
plain code (not locale-aware → a local helper, **not** a `shell(mono)`). _Glue_: a
button component. Assumption stated: a **single** timer (one `gear:outer`, not
vertex).

**Plan:**

```
outer/timer   gear:outer (state: running, elapsed; start/stop; _.cell display)
shell/timer   shell (start, stop labels)
<Timer>       React consumer — Plug("outer/timer", "shell/timer")
```

**Dispatch** to Section B for each. The resulting shape (sketch — full templates
in the pattern files):

```ts
// pub/outer/timer.ts — gear:outer (patterns/outer.md; interval → [Symbol.dispose])
const fmtMMSS = (s: number) =>
  `${(s / 60) | 0}:${`${s % 60}`.padStart(2, "0")}`;

export const r = OuterGear.withState({ running: false, elapsed: 0 }).define(
  (plugin, _) => {
    const { $ } = plugin;
    let handle: ReturnType<typeof setInterval> | undefined;
    const tick = _.action(() => ({ elapsed: $.state.elapsed + 1 }));
    return {
      running: _.getter(() => $.state.running),
      display: _.cell(() => fmtMMSS($.state.elapsed)),
      start: _.action(() => {
        handle ??= setInterval(tick, 1000);
        return { running: true };
      }),
      stop: _.action(() => {
        clearInterval(handle);
        handle = undefined;
        return { running: false };
      }),
      [Symbol.dispose]: () => clearInterval(handle),
    };
  },
);
export type Outer_Timer = RShape<typeof r>;
```

```tsx
// pub/shell/timer/en.tsx — shell (patterns/shell.md)
export const r = { start: "Start", stop: "Stop" };
export type Shell_Timer = RShape<typeof r>;
```

```tsx
// components/timer.tsx — glue (patterns/consume/plug.md)
const plug = Plug("outer/timer", "shell/timer");
export function Timer() {
  const [timer, t] = plug.useR();
  return (
    <button onClick={() => (timer.running ? timer.stop() : timer.start())}>
      {timer.running ? t.stop : t.start} — {timer.display}
    </button>
  );
}
Timer.plug = plug;
```

Both resources register in the atlas
([patterns/atlas-update.md](./patterns/atlas-update.md)); a test drives them with
`mockPlug` ([testing.md](./testing.md)).

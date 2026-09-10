---
"rforge": patch
---

Skill: document kit access on the consumer side.

`$.kit.fmt.*` is used throughout the example apps — Next server components, Next client components, and the standalone renderer — but none of the consumer references documented it. `patterns/consume/client-plug.md` and `server-plug.md` never mentioned `$.kit` at all; `plug.md` deferred "kit access" to `patterns/plugin-context.md`; only `direct-plug.md` spelled it out. `plugin-context.md` in turn opens by saying both dep forms are accepted "on every consumer plug", but every code example in it is a `Shell.define` declaration site. A model reaching for the formatter from a component had to deduce `$.kit.fmt.number(...)` by analogy with a list-form shell and let `tsc` confirm the guess.

The analogy happens to be exact, and now says so. `MapPlugin` / `ListPlugin` in `core/plug.ts` are shared by every plug and every declaration site: the map form spreads the kit as top-level keys (`Omit<KM, keyof DM>`), the list form does not, and `$.kit` works in both.

- `plug.md`, `client-plug.md` and `server-plug.md` each gain a **Kit access** note, alongside the existing "Deps allowed" / "Which form" / "Localized links" notes, with the point that the declaration site differs per plug (`kit` / `clientKit` / `serverKit` on the strategy, `directKit` on `RMachine.create`) while the access path is `$.kit` for all of them.
- `plugin-context.md` gains a consumer example — list form through `$.kit`, map form with the kit keys hoisted — so its "every consumer plug" claim is backed by code rather than by inference, plus the `Omit<KM, keyof DM>` consequence a reader would not guess: **a dep name shadows a kit key of the same name**, leaving the kit entry reachable only as `$.kit.<entry>`.

# Concept — Relay execution model

A relay (`_.relay({ select, onChange, equals? })`) reacts to state changes. It is
**not** a plain callback: its effects run inside a deterministic **flush** so that
a batch of mutations settles predictably.

The flush runs at the **end of the outermost action's transaction** and loops over
**three phases** until no relay or state cell is dirty:

1. **Relays** — every dirty relay's `onChange` fires in deterministic order; the
   `Cmd`s it returns are **collected, not yet dispatched**, so all relays in the
   batch observe the **same** state.
2. **Commands** — the collected `Cmd`s are dispatched in order, each as a nested
   transaction; their mutations feed back into the dirty queues.
3. **Notifications** — subscribed consumers are notified, deduplicated per cell.

Why `_.cmd` (not calling the action directly): a `Cmd` is an inert descriptor
(action + bound args). Returning it from `onChange` keeps mutations **out** of the
select/notify phase, so the batch stays consistent. `_.cmd` is **valid only as the
return of a relay's `onChange`** — never inside an `_.action` body.

**Loop protection.** A relay may fire at most **3 times per flush**; on the 4th it
emits a `relay:loopDetected` event and throws `RelayLoopError`, aborting the
flush. A hard cap stops any flush after 100 iterations.

**Ordering.** By default relays fire in registration order; a fully-configured
`RMachine` orders them by distance from the mutation source, then atlas-declared
priority, then registration.

```ts
_.relay({
  select: () => $.state.count,
  onChange: (curr) => (curr > 10 ? _.cmd(reset) : undefined),
  // equals: "shallow" — skip onChange when the selected value is shallow-equal
});
```

See the relay pattern in [../patterns/outer.md](../patterns/outer.md); the
testing "tick cell" gotcha in [../testing.md](../testing.md).

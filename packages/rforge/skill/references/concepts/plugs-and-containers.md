# Concept — The four plugs and their containers

Every consumer reads resources through a **plug**. The four differ only in the
**container** they bind to — which decides sync vs async, the locale source, and
which families they can reach. `DirectPlug` is the container-free base case; the
others add a container.

| Plug         | Container / locale source                  | Call                | Can consume                |
| ------------ | ------------------------------------------ | ------------------- | -------------------------- |
| `Plug`       | React context (web React)                  | **sync** (suspends) | shell, base, outer, vertex |
| `ClientPlug` | React context (Next client)                | **sync** (suspends) | shell, base, outer, vertex |
| `ServerPlug` | Next request scope (headers)               | **async** (`await`) | shell, base, **inner**     |
| `DirectPlug` | **none** — locale passed to `useR(locale)` | **async** (`await`) | shell, base **only**       |

Notable asymmetries:

- `ServerPlug` **cannot** consume `gear:outer`/`vertex` (no client state container);
  `Plug`/`ClientPlug` **cannot** consume `gear:inner` (server-only).
- `DirectPlug` reaches only the `valid@direct` families (shell + base) — exactly
  those whose resolution is a pure function of locale.

The consumer `$` context also varies by plug:

| `$` field     |   `Plug`    | `ClientPlug` |    `ServerPlug`     |      `DirectPlug`      |
| ------------- | :---------: | :----------: | :-----------------: | :--------------------: |
| `$.locale`    |      ✓      |      ✓       |          ✓          |   ✓ (read-only echo)   |
| `$.setLocale` |      ✓      |      ✓       |          ✓          | ✗ (no bound container) |
| `$.getPath`   |      ✗      |      ✓       |          ✓          |           ✗            |
| `$.params`    |      ✗      |      ✗       | ✓ (params overload) |           ✗            |
| `$.kit`       | if declared | if declared  |     if declared     |      if declared       |

Consumer patterns per plug live in [../patterns/consume/](../patterns/consume/).
`$.setLocale` is how you change the active locale (e.g. a language switcher) — a
resourceless `Plug()`/`ClientPlug()` gives you just `$`; see
[../patterns/consume/plug.md](../patterns/consume/plug.md#switch-the-locale-language-switcher).
`$.getPath` (Next `ClientPlug`/`ServerPlug` only) builds type-safe localized URLs;
see [../next-features.md](../next-features.md#pathatlas-and-localized-urls).

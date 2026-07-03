# Concept — Dependency-graph asymmetry & bridge gears

The families form a **deliberately asymmetric** dependency graph, enforced by the
compiler at the `withDeps(...)` call site. Each family may depend only on:

| Family                  | May depend on                                           |
| ----------------------- | ------------------------------------------------------- |
| `gear:inner`            | `gear:inner`, `gear:base`                               |
| `gear:base`             | `gear:base`                                             |
| `gear:outer`            | `gear:outer`, `gear:base`                               |
| `gear:outer(vertex)`    | same as `gear:outer` — **but cannot be a dep itself**   |
| `shell` / `shell(mono)` | `shell`, `shell(mono)`, `gear:base` _(only if bridged)_ |

Key consequences:

- **No dep path connects `gear:inner` to `gear:outer`/`vertex`/`shell`.** Inner
  (server-only) and outer (stateful/client) live in separate halves of the graph.
- **A shell is never a _plain_ dep of a gear**. The one bridge is `res.perLocale`
  (below): it admits a shell as a locale _loader_, never a resolved surface.
- **Vertex gears are consumer-only** — per-consumer instances, so nothing may
  depend on one.

**Bridge gears.** A shell may reach a `gear:base` **only** if that namespace is
listed in `bridgeGears` on `RMachine.create(...)`. The option is type-narrowed to
`gear:base` namespaces (an outer/inner namespace there is a compile error). This
keeps the shell→logic door explicit, not open by default.

```ts
RMachine.create({ /* … */, bridgeGears: ["base/config"] });
// now a shell may: Shell.withDeps("base/config").define(...)
```

**Reaching a shell from a gear — `res.perLocale`.** The ordinary division of labour:
a **gear** holds logic (locale-agnostic — it has no `$.locale`), a **shell** holds
localized content, and a **React consumer** unites the two, reading both as plain
surfaces. So gears normally do **not** depend on shells — and that is why a gear is
not tied to a locale.

The exception is when the logic _itself_ produces an effect that needs content in a
specific language — e.g. an `InnerGear` that sends a confirmation **email** in the
recipient's locale (the locale arrives as _data_, not as ambient context). Declare
the shell with `res.perLocale(...)` inside `withDeps`: the dep resolves not to a
surface but to a **loader** `(locale) => Promise<Surface>` the gear calls with a
locale it gets at runtime. Works for any gear family — and inside a shell too (to
reuse another locale's content). `res` comes from `createToolset()`.

```ts
// prv/inner/mailer.ts — sends a confirmation email in the RECIPIENT's locale
InnerGear.withDeps({
  mail: res.perLocale("shell/mail"),
})
  .withPorts({ sendMail })
  .define((plugin) => {
    const { mail, $ } = plugin;
    return {
      confirm: async (to: string, locale: Locale) => {
        const s = await mail(locale);
        await $.ports.sendMail(to, s.subject, s.body);
      },
    };
  });
```

**Batch helpers.** `res.perLocale` also carries two resolution-time helpers (they
close over the configured locales) for folding several loader calls into one:

```ts
// pickAll(loader | map) → resolve EVERY locale, locale-major (Record<Locale, …>).
const all = await res.perLocale.pickAll(mail);
// → Record<Locale, { subject: string; body: string }> — e.g. render side-by-side translations.

// pick(locale, map | tuple) → resolve a batch at ONE locale, shape preserved.
// (subject/body would each be their own res.perLocale dep declared in withDeps.)
const { subject, body } = await res.perLocale.pick(locale, {
  subject: subjectLoader,
  body: bodyLoader,
});
// map arg → { subject: Surface; body: Surface }; a tuple arg → a tuple result.
```

Why it matters: the asymmetry is what makes "where can X live / what can it use?"
have a single compiler-checked answer — the structural discipline, not a
convention. The full dep matrix is also summarised in `SKILL.md` (Step 1).

**The consumer is where families meet.** A gear reaches a shell only indirectly (as
a locale loader via `res.perLocale`), yet a component routinely needs both behavior
(the gear) and localized content (the shell) as plain surfaces. That's not a
contradiction: a **consumer plug** binds multiple namespaces at once —
`Plug("outer/timer", "shell/timer")` → `[timer, t, $]`. The dep graph
constrains how resources depend on each other; the consumer is the meeting point
where independent families are read together. See
[../patterns/consume/plug.md](../patterns/consume/plug.md#consume-multiple-resources).

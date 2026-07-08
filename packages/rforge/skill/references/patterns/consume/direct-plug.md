# R-Machine Patterns — Consume with `DirectPlug` (container-free, async, runs anywhere)

`Plug`/`ClientPlug` are bound to a React context; `ServerPlug` is bound to the
Next request scope (headers/cookies). `DirectPlug` is bound to **nothing**: you
pass the locale to `useR(locale)` yourself. Because it carries no container, it
runs **anywhere** — a server component, a client event handler, a queue worker,
a cron job, or a template renderer.

It comes from the **core toolset** (`rMachine.createToolset()`), so it is the same
import everywhere — React, Next, or a standalone Node setup. Deps are restricted
to **shells + base gears** — exactly
the resources whose resolution is a pure function of locale (no inner/outer/vertex
gears, which need a state container).

To mock this plug in a test see [../../testing.md](../../testing.md). For a
standalone/Node project that consumes only via DirectPlug, see
[../../standalone-setup.md](../../standalone-setup.md).

```tsx
// emails/welcome.tsx — a React Email template, localized.
import { DirectPlug } from "@/r-machine/setup"; // or @/r-machine/toolset (React)

const plug = DirectPlug("shell/email/welcome");
export async function WelcomeEmail({
  locale,
  name,
}: {
  locale: string;
  name: string;
}) {
  const [s, $] = await plug.useR(locale);

  // s        → the localized shell surface
  // $.locale → readonly echo of `locale` (pass it on to nested templates)
  // $.kit    → directKit resources (if configured)
  return (
    <Html lang={$.locale}>
      <Text>{s.greeting(name)}</Text>
    </Html>
  );
}
WelcomeEmail.plug = plug;
```

```ts
// Sending the email from a queue worker / route handler — no request scope needed:
import { render } from "@react-email/render";
const html = await render(
  await WelcomeEmail({ locale: user.locale, name: user.name }),
);
```

Notes:

- `useR` is **async**. On the client, call it in an async handler/effect — never
  directly in render (unlike the sync, Suspense-driven `ClientPlug`).
- To curate ambient shared resources for direct plugs, pass `directKit: { … }`
  to `RMachine.create(...)` (shell + base-gear namespaces only); they surface as
  `$.kit`.
- Prefer `ServerPlug` inside server components (it also gives `getPath`/`params`
  and auto-binds the locale from the request); reach for `DirectPlug` when there
  is **no** request/React context to bind to.

---

## Mock it in a test

`DirectPlug` deps are positional — override by index. The real `useR(locale)`
runs against the mock; untouched deps stay real:

```ts
import { mockPlug } from "@r-machine/testing";
import { render } from "./render"; // render.plug = DirectPlug("shell/greeting", "base/config")

using _ctrl = mockPlug(render).with({
  0: { greet: (n: string) => `MOCK ${n}` },
});
// call the real `render(locale)` (which uses `plug.useR(locale)`) and assert
```

A `$.locale` override is a no-op here (DirectPlug's locale is explicit). Full
pattern in [../../testing.md](../../testing.md).

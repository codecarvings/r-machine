# R-Machine × React — feature showcase (Vite SPA)

A client-only React app that tours R-Machine's primitives one at a time. There
is **no router**: the active view is the state of an OuterGear (`outer/nav`), so
the navigation itself is a live demo — **the router is a gear**. Each view pairs
an interactive demo with its **real source**.

This is the React/Vite counterpart to [`examples/next`](../next) (the Next.js App
Router showcase). One constraint shapes it: `ReactStandardStrategy` is
client-only, so **InnerGear is not available** (it's server-only and rejected at
compile time). What's left is the full client surface — and that's what the tour
covers.

Flip the locale from the header: language, number/date/currency formatting, and
every label re-resolve at once, with no `if (locale === …)` anywhere — because in
R-Machine **i18n is dependency injection**.

## What it demonstrates

| Topic | Where | What it shows |
| --- | --- | --- |
| **The router is a gear** | [`outer/nav`](src/r-machine/outer/nav.ts) + [`sidebar`](src/components/showcase/sidebar.tsx) | The active view is OuterGear state; switching views is an action. It even survives HMR. |
| **OuterGear** | [`outer/timer`](src/r-machine/outer/timer.ts) | A reactive gear: `action`, `getter`, a memoized `cell`, a `relay` (derives odd/even), a dep on `base/config`, and `Symbol.dispose` cleanup. |
| **Gear dependencies** | [`outer/operator`](src/r-machine/outer/operator.ts) | Depends on `outer/timer` by token — injected fully typed, no imports, no wiring. |
| **Vertex + VertexFrame** | [`vertex/counter`](src/r-machine/vertex/counter.ts) | Per-consumer instances by default; consumers under a `<VertexFrame>` share one. |
| **Async shells + Suspense** | [`shell/async-demo`](src/r-machine/shell/async-demo/en.tsx) | An async shell suspends its consumer; `DelayedSuspense` shows a fallback only if the wait is noticeable. |
| **Locale-aware formatting** | [`shell/lib/fmt`](src/r-machine/shell/lib/fmt.ts) | A mono shell wrapping the native `Intl` APIs; numbers/currency/dates/plurals reformat on locale switch. |
| **Localization without a router** | [`shell/showcase`](src/r-machine/shell/showcase/en.tsx) | Every string is a localized shell; the locale is persisted to `localStorage` and reapplied on reload — no URL. |
| **BaseGear** | [`base/config`](src/r-machine/base/config.ts) | Stateless app config the timer depends on. |
| **Source on demand** | [`code-block`](src/components/showcase/code-block.tsx) | Each view's "Source" tab shows the real file via `?raw`, highlighted with `shiki`. |
| **Testing with `mockPlug`** | [`tests/`](tests) | `mockPlug` seeds/observes a gear's real state; client components render with **no provider**. Plus `verifyResourceAtlas`. |

## Run it

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # tsc -b && vite build
pnpm preview   # serve the production build
pnpm test      # vitest: gear, gear-dependency & component (mockPlug) tests + verifyResourceAtlas
```

(From the monorepo root: `pnpm --filter @r-machine/examples-react <script>`.)

## Layout

- `src/r-machine/` — R-Machine resources (`base/config`, `outer/{nav,timer,operator}`,
  `vertex/counter`, shells), plus `setup.ts`, `resource-atlas.ts`, the toolset, and
  the Vite HMR plugin (`vite-plugin-r-machine-hmr.ts`) that hot-reloads resources.
- `src/components/showcase/` — `app-shell`, `sidebar` (gear-driven nav), `feature-view`
  (Demo / Source tabs), `code-block` (shiki), `locale-switcher`, and one `views/*` demo
  per primitive.
- `src/components/ui/` — shadcn/ui primitives.

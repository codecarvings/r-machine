# @r-machine/examples-standalone

R-Machine used **standalone** — only the `r-machine` core package, **no framework
strategy** (`@r-machine/react` / `@r-machine/next`), **no bundler**. A tiny Node CLI
resolves localized resources through `DirectPlug`.

`DirectPlug` connects directly to R-Machine: you pass the locale explicitly to
`useR(locale)`, resolution is `async`, and it consumes the stateless subset of resources
(shells + base gears).

## Run

```sh
pnpm --filter @r-machine/examples-standalone start
```

Expected output (one block per configured locale):

```
[en] Hello, Sergio!  | app: R-Machine Standalone
        $12,345.60 | June 25, 2026
[it] Ciao, Sergio!  | app: R-Machine Standalone
        12.345,60 € | 25 giugno 2026
```

## Test

```sh
pnpm --filter @r-machine/examples-standalone test
```

Three vitest suites, all in a pure-Node environment:

- **`direct-plug.test.ts`** — real `DirectPlug` resolution for every locale (`$.locale`
  echo, `$.kit` from `directKit`, Intl formatting), no strategy present.
- **`r-machine/setup.test.ts`** — `verifyResourceAtlas` confirms every declared resource
  resolves through the loader.
- **`r-machine/greeting.test.ts`** — `mockPlug` substitution on the direct plug.

## Files

| Path | Role |
| ---- | ---- |
| `src/r-machine/setup.ts` | `RMachine.create(...)` + `createToolset()` — **no strategy**; imports `./pub/loader` |
| `src/r-machine/resource-atlas.ts` | layout (folder → family) + resource type map |
| `src/r-machine/pub/loader.ts` | the explicit module map — registers the loader |
| `src/r-machine/pub/base/config.ts` | a base gear |
| `src/r-machine/pub/shell/greeting/{en,it}.ts` | a locale-aware shell |
| `src/r-machine/pub/shell/lib/fmt.ts` | a `shell(mono)` formatter, exposed via `directKit` |
| `src/render.ts` | the renderer — owns the `DirectPlug`, returns localized output for a locale |
| `src/main.ts` | the CLI — loops the configured locales and prints `render(locale)` |

The loader is an explicit module map (`pub/loader.ts`) — there is no bundler magic. Each entry
is a literal `import(...)`, so the same loader works identically under plain `tsx` (the CLI),
under Vite (vitest), and inside `verifyResourceAtlas`.

# @r-machine/testing

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Rename the `mockPlug` consumer locale-override key `$.locale` → `$.ambientLocale`, and forbid it entirely on `DirectPlug`.

  The override meant three different things behind one name, which had already produced a precedence bug. The key is now named by plug kind, enforced by type:
  - **Resource plugs** (`Shell` / `shell(mono)`, `r.plug`): keep `$.locale` — it resolves the resource **at** that locale (the override wins). Unchanged.
  - **Ambient consumers** (`Plug` / `ClientPlug` / `ServerPlug`): the key is now `$.ambientLocale` — the locale the absent ambient container (React context / request header) would have supplied; a fallback that loses to an explicitly-passed locale.
  - **`DirectPlug`**: exposes **no** locale key (neither `$.locale` nor `$.ambientLocale`) — its locale is always explicit, so overriding it is a compile error; mock a dependency instead.

  Migration: in consumer-plug tests, rename `.with({ $: { locale } })` → `.with({ $: { ambientLocale } })`. Resource-plug mocks (`mockPlug(shell.plug)`) are unchanged. Internally, `PlugOverride.locale` was renamed to `ambientLocale`.

- be0872d: `verifyResourceAtlas` now accepts a `string | URL` for the setup-file path. Passing a `file:` URL (or a `URL` object) — e.g. `verifyResourceAtlas(import.meta.resolve("../../src/r-machine/setup.ts"))` — anchors the path to the test file rather than `process.cwd()`, so it reads correctly in a nested test file and is cwd-independent. Plain relative/absolute path strings still resolve against the cwd (backward compatible).
- Updated dependencies [be0872d]
- Updated dependencies [be0872d]
  - r-machine@1.0.0-alpha.13

## 1.0.0-alpha.12

### Patch Changes

- ec6c1fc: Ground-up rewrite of R-Machine on a single unified primitive.

  This release rebuilds the entire engine around one insight: i18n and dependency
  injection are the same problem — typed, context-dependent resource resolution.
  Everything resolves through one access primitive (`Plug`) over a single resource
  model, so the same machinery powers locale-aware content, shared state, and
  injected services without separate subsystems.

  Because the surface area changed comprehensively, this entry is intentionally
  high-level rather than an exhaustive per-symbol diff. The headline themes:
  - **Unified resource model.** A single entity model (logic+state, content, and
    their fusion) resolved uniformly through `Plug`, with kind-based dependency
    scoping enforced by the type system.
  - **Architectural discipline enforced by the compiler.** Wrong wiring is
    unrepresentable rather than merely flagged; dependency declarations are
    token-based for precise, readable type errors.
  - **Per-locale architecture.** Locales are first-class and fully typed
    end-to-end, delivering zero-cost i18n readiness without per-message runtime
    negotiation.
  - **Next.js App Router integration via routing strategies** (flat / path /
    origin), with proxy-driven locale routing and a request-scoped server model
    that yields SSR's process/request two-tier caching for free.
  - **React adapter** with a per-consumer wire model, state that survives HMR, and
    opt-in React Compiler interop.
  - **`@r-machine/testing`** built on a single uniform test primitive (`mockPlug`)
    that works identically across every entity kind and on React consumers.
  - **`rforge` CLI + LLM Skill** for scaffolding and agent-assisted development,
    treating the Skill as product surface on par with the code.

  Migrating from a previous alpha: treat this as a new baseline. The public API,
  generic signatures, and configuration entry points changed throughout; follow
  the current docs and the `rforge` scaffolds rather than porting old call sites
  mechanically.

- Updated dependencies [ec6c1fc]
  - r-machine@1.0.0-alpha.12

---
"@r-machine/next": patch
---

Fix a dev-only `ERR_MODULE_NOT_FOUND` on `next/navigation` when the jiti dev loader walks a resource graph that reaches the server toolset — e.g. an OuterGear importing a `"use server"` action that uses `ServerPlug`, both during dev HMR and under `verifyResourceAtlas`.

The dev importer follows static imports across boundaries that Next's bundler would otherwise split, ending up in `next/*` subpaths that pure-ESM resolution can't resolve (`next` ships no `exports` map, so its entrypoints are extensionless files the bundler — but not Node ESM — extends to `.js`). Two boundaries are now handled:

- **`"use client"` boundary.** Under jiti, any module carrying a leading `"use client"` directive is replaced with a client-reference stub (mirroring what Next does in a build), so `client-toolset` and its `next/navigation` import are never executed server-side.
- **Server toolset construction.** `createClientToolset`/`createServerToolset` now memoize their result on the `rMachine`. Under dev HMR the jiti-loaded copy reuses the real toolset Next already built — so server actions invoked from an OuterGear factory keep working. Under `verifyResourceAtlas` (no Next runtime to build it), `createServerToolset` returns an inert toolset instead of constructing, which would otherwise import the strategy server-impl and crash on `next/navigation`. This is safe because the verifier only loads modules and checks their shape; it never runs factories.

No API changes; production builds are unaffected.

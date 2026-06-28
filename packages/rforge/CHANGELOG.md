# rforge

## 1.0.0-alpha.14

### Patch Changes

- 7c87299: Move module loading off `RMachine.create({ load })` onto `ResourceAtlas.loader`, and split resources into `pub/` (client-safe) and `prv/` (server-only) folders — fixing a security bug where server-only `inner/` gears could leak into the Next.js client bundle.

  - **New loader API.** `ResourceAtlas.loader.register(prefixes, fn)` registers a `(path, options) => Promise<module>` loader for one or more layout prefixes, or `["*"]` as a catch-all (a prefix-specific loader wins over `"*"`). Multiple `register` calls accumulate. The `load` option on `RMachine.create(...)` is **removed**; the config now carries the loader. New error `ERR_NO_LOADER_REGISTERED` when a layout prefix has no matching loader.
  - **`pub/` + `prv/` folders.** Resources live under `pub/` (`base`/`outer`/`vertex`/`shell`) or `prv/` (`inner`), each owning a `loader.ts` whose dynamic-import glob is rooted there. `pub/loader.ts` is imported from `setup.ts`; `prv/loader.ts` is fenced with `import "server-only"` and imported only from `server-toolset.ts`, so the server-only glob never reaches the client bundle. The `pub`/`prv` segment is filesystem-only — atlas namespaces are unchanged (`base/config`, `inner/catalog`). Projects with no server-only resources use `pub/` only and register `["*"]`. `server-setup.ts` is removed.
  - **Build-safe green-field.** Because each glob is rooted at a folder that always contains its `loader.ts`, the bundler context is never empty — scaffolding the folders before adding any resource no longer breaks the first build.

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Update the bundled R-Machine LLM Skill installed by `rforge skill`.

  Ships the comprehensive Skill revision so freshly installed projects get the up-to-date authoring guidance (DirectPlug, plug-attach convention, current OuterGear/BaseGear/InnerGear surface).

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

---
"r-machine": patch
"@r-machine/react": patch
"@r-machine/next": patch
"@r-machine/testing": patch
"rforge": patch
---

Ground-up rewrite of R-Machine on a single unified primitive.

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

---
"rforge": patch
---

Skill: tell webpack users why `next build --webpack` warns about top-level await.

`client-toolset.ts` and `pub/loader.ts` are created with top-level await, and Next targets the client bundle at `["web", "es6"]` — ES2015 predates async/await, so webpack emits `EnvironmentNotSupportAsyncWarning` on both modules. The bundle is correct, but nothing in the Skill explained the warning or how to silence it.

### Changed

- `references/next-setup.md` §2.3 — a note after the `client-toolset.ts` snippet: which two files warn, why, and the `next.config` webpack callback that drops the ES2015 constraint. It scopes the fix to the client compilation and says why the `isServer` branch must be left alone (already Node-targeted, and it also covers the edge compilation, which is not Node).

---
"r-machine": patch
"@r-machine/react": patch
"@r-machine/next": patch
"@r-machine/testing": patch
"rforge": patch
---

Loosen the inter-package peer ranges, declare a supported Node range, and stop shipping coverage artifacts.

**Peer ranges.** The R-Machine packages declared each other with `workspace:*`, which pnpm rewrites to an **exact** version at publish time — `@r-machine/react@1.0.0-alpha.15` required literally `r-machine@1.0.0-alpha.15`. Any drift between two installed R-Machine packages was therefore an `ERESOLVE` failure rather than a warning. They now use `workspace:^`, published as `^1.0.0-<version>`, which accepts later releases of the same line and the eventual stable `1.0.0`. The packages still version and publish in lockstep, so a matched set remains the expected install.

**`engines`.** All five packages now declare `"node": ">=20.9.0"`. This is the floor the codebase already assumed rather than a new restriction: `Symbol.dispose` (the resource-teardown convention) needs Node 20.4+, and `@r-machine/next` targets a Next.js version that itself requires 20.9+. Node 18 is end-of-life.

**Packaging.** The `files` globs (`**/*.js`, `**/*.d.ts`, …) matched anything anywhere in the package directory, so a local coverage run leaked `coverage/*.js` into the tarball. `files` now excludes `**/coverage/**`.

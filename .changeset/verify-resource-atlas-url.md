---
"@r-machine/testing": patch
---

`verifyResourceAtlas` now accepts a `string | URL` for the setup-file path. Passing a `file:` URL (or a `URL` object) — e.g. `verifyResourceAtlas(import.meta.resolve("../../src/r-machine/setup.ts"))` — anchors the path to the test file rather than `process.cwd()`, so it reads correctly in a nested test file and is cwd-independent. Plain relative/absolute path strings still resolve against the cwd (backward compatible).

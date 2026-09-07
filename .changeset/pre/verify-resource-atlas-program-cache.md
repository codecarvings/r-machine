---
"@r-machine/testing": patch
---

Speed up `verifyResourceAtlas` by caching parsed TypeScript `SourceFile`s across calls.

The static analysis pass created a fresh `ts.Program` per call, re-parsing and re-binding the entire type graph reachable from the setup file (`lib.d.ts` plus the whole r-machine `.d.ts` surface) every time. A process-scoped cache, installed via a custom `CompilerHost`, now reuses already-parsed `SourceFile`s across sequential programs (TS's binder skips a file whose `locals` are already set, and each program's checker keeps its own per-node links, so sharing immutable bound source files is safe). The cache is keyed by path and invalidated by mtime, so a file edited between calls is re-parsed.

Production usage calls `verifyResourceAtlas` once per process and is unaffected; repeated callers (the test suite, or a future watch mode) get the win. In this repo the full coverage run dropped from ~28s to ~8s — the suite's single slowest file was driving the TS compiler 28 times, and under v8 coverage the compiler's execution was being instrumented on each one.

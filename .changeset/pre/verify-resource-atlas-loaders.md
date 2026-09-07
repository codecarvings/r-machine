---
"@r-machine/testing": patch
---

`verifyResourceAtlas` now accepts a `loaders` option — an array of extra loader modules (path or `URL`) to import for their registration side-effect before verification runs.

This is needed for a split Next.js setup, where `setup.ts` imports only `pub/loader` and the server-only `inner/` loader lives in `prv/loader.ts` (imported only by `server-toolset.ts`). Without it, `inner/` keys fail with `ERR_NO_LOADER_REGISTERED`. Pass the server-only loader so its resources are checked too:

```ts
const report = await verifyResourceAtlas(
  import.meta.resolve("../../src/r-machine/setup.ts"),
  { loaders: [import.meta.resolve("../../src/r-machine/prv/loader.ts")] },
);
```

Because `prv/loader.ts` starts with `import "server-only"` (which throws outside an RSC bundle), alias `server-only` to a no-op in the vitest config: `resolve.alias["server-only"] = "@r-machine/next/dev/no-op"`. A loader module that throws while importing is reported as a new `loader-module-failed` issue.

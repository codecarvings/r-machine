---
"r-machine": patch
"@r-machine/next": patch
"rforge": patch
---

Move module loading off `RMachine.create({ load })` onto `ResourceAtlas.loader`, and split resources into `pub/` (client-safe) and `prv/` (server-only) folders — fixing a security bug where server-only `inner/` gears could leak into the Next.js client bundle.

- **New loader API.** `ResourceAtlas.loader.register(prefixes, fn)` registers a `(path, options) => Promise<module>` loader for one or more layout prefixes, or `["*"]` as a catch-all (a prefix-specific loader wins over `"*"`). Multiple `register` calls accumulate. The `load` option on `RMachine.create(...)` is **removed**; the config now carries the loader. New error `ERR_NO_LOADER_REGISTERED` when a layout prefix has no matching loader.
- **`pub/` + `prv/` folders.** Resources live under `pub/` (`base`/`outer`/`vertex`/`shell`) or `prv/` (`inner`), each owning a `loader.ts` whose dynamic-import glob is rooted there. `pub/loader.ts` is imported from `setup.ts`; `prv/loader.ts` is fenced with `import "server-only"` and imported only from `server-toolset.ts`, so the server-only glob never reaches the client bundle. The `pub`/`prv` segment is filesystem-only — atlas namespaces are unchanged (`base/config`, `inner/catalog`). Projects with no server-only resources use `pub/` only and register `["*"]`. `server-setup.ts` is removed.
- **Build-safe green-field.** Because each glob is rooted at a folder that always contains its `loader.ts`, the bundler context is never empty — scaffolding the folders before adding any resource no longer breaks the first build.

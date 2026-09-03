---
"rforge": patch
---

Bring the bundled R-Machine LLM Skill's generated Vite/Vitest configs in line with ESM-only config loading.

Vite's `configLoader: 'native'` (a planned future default) runs config files as real ESM, so the Skill now generates configs that hold up under it. Two changes:

- **`"type": "module"` is now checked before generating `vitest.config.ts`** (`testing.md`, with a pointer from `next-setup.md` §0). Every config the Skill emits is ESM, but `create-next-app` does not set the field — so a Next project would load its `vitest.config.ts` as CommonJS. `create-vite` already sets it, which is why only the Next path was silently affected. The note also covers the CJS escape hatch (`vitest.config.mts`).
- **`path.resolve(import.meta.dirname, "src")` replaces `fileURLToPath(new URL("./src", import.meta.url))`** in every `vite.config.ts` / `vitest.config.ts` snippet (`react-setup.md`, `testing.md`), matching the repo's own examples, and `vite.config.ts` now carries an explicit "never the CJS `__dirname`" comment.

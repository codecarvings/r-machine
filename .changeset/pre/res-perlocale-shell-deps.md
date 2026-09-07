---
"r-machine": patch
"@r-machine/testing": patch
"rforge": patch
---

Add `res.perLocale` — declare a locale-keyed shell as a dependency of a locale-agnostic gear (or another shell).

A gear has no ambient locale, so it cannot hold a shell as a plain resolved surface. `res.perLocale("shell/x")` (from the toolset) declares the shell as a dependency whose resolved value is a **loader** `(locale) => Promise<Surface>` the resource calls with a locale it receives at runtime — e.g. an `InnerGear` that renders a multilingual email in the recipient's locale. The `locale` parameter is typed to the atlas's configured locale union (an invalid locale is a compile error). It works in `withDeps` of any gear family, and inside a `Shell` (to reuse another locale's content on demand). The plain-dependency asymmetry is unchanged: a bare `shell/…` is still not a valid gear dependency — `res.perLocale` is the one sanctioned bridge, resolving to a loader rather than a surface.

Two resolution-time batch helpers fold multiple loaders into a single call: `res.perLocale.pickAll(loader | map)` resolves every configured locale, locale-major (`Record<Locale, …>`); `res.perLocale.pick(locale, map | tuple)` resolves a batch at one locale, preserving map/tuple shape.

`@r-machine/testing`: a `res.perLocale` dependency is mocked with a function `(locale) => partial`, deep-merged over the real localized surface (per call, per alias).

`rforge`: the bundled Skill documents `res.perLocale` / `pickAll` / `pick`, and corrects the former "a shell can never be a dependency of a gear" guidance.

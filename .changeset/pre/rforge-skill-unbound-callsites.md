---
"rforge": patch
---

Teach the Skill `useUnboundR` and the one-plug-per-function rule.

`useUnboundR` appeared nowhere in the Skill, and `server-plug.md` modelled the render tree as a **dichotomy** — "entry point (receives `params`)" vs "nested (no `params`)" — while explicitly adding that passing `params` around still works. `generateMetadata` receives `params`, so it fell mechanically into the entry-point bucket and got `useR(params)`, silently binding the locale from a function that owns no render tree. The failure was not a rule being ignored; it was a correct application of an incomplete rule.

`server-plug.md` now carries a **three call site** table keyed on a question rather than an enumeration of Next APIs — _does this function own the render tree for this request?_ — so an export the table does not list (`sitemap.ts`, `opengraph-image.tsx`, a future one) resolves by the criterion instead of pattern-matching to the nearest row. It states the real semantics (`useR` → `bindLocale`, writes the request context, `notFound()` on an invalid locale, `ERR_LOCALE_BIND_CONFLICT` on a divergent re-bind; `useUnboundR` → `getValidLocale`, validate-and-canonicalise only, throws), that `useUnboundR` always takes an argument, that `DirectPlug` has none, and the complete five-overload `ServerPlug` surface.

The **one plug per function** rule is now written down in `server-plug.md` and `testing.md`: each consuming export declares its own plug and carries it as `Fn.plug`. `mockPlug` resolves a target through `.plug` and keys on that plug's identity, so a shared plug makes a page's metadata unmockable without the page — and mocking both throws `ERR_PLUG_ALREADY_MOCKED`. The carrier is whichever function calls the plug, not necessarily the default export.

`next-features.md` gains "read without binding" beside bind/switch, and `SKILL.md` Step 4 a one-line rule. All of it documents what the five Next examples already do — `generateMetadata` (5/5) and `generateStaticParams` (4/4) have used `useUnboundR` with their own plug all along; only the Skill was behind. The `testing.md` mock example was verified by running it against `examples/next`.

---
"rforge": patch
---

Skill: document how a vertex gear is consumed — the case the family exists for.

`references/patterns/vertex.md` showed how to *write* a vertex gear and then compressed the whole consumer story into two reminder lines ("each `useR()` call creates its own instance"; "use `<VertexFrame>` to share"). The entire semantic of the family lives on the consumer side, and nothing else covered it: the `patterns/consume/*.md` files name `gear:outer(vertex)` only in their allowed-deps lists. A model implementing the canonical request — "let this component appear several times on the page" — had to open `vertex-frame.d.ts` in the installed package to confirm which way round it worked.

The repo made that worse rather than better. The one vertex example in `examples/next` is the **sharing** case (`vertex/catalog-filter`, read and written by both the filter bar and the grid through a `VertexFrame`), so an agent verifying against the examples finds the exception, not the default.

vertex.md now has two sections built from that example's real code shape:

- **Consume it — several independent instances on one page.** The contrast with `gear:outer` (one shared instance per `(namespace, locale)`) stated outright, a two-sibling snippet, and the point that trips people: the `plug` const is module-level and shared by every render while the *instance* is not, so independence needs no key, prop or wrapper.
- **Share one instance — `<VertexFrame>`.** The opposite case, with the note that `gear` accepts one surface or an array, and that `VertexFrame` ships alongside the plug it pairs with (`createClientToolset()` in Next, `createToolset()` in React).

Both carry the reason this deserves prose rather than a reminder line: getting it backwards **fails silently**. Two counters that wrongly share state are visually identical to two independent ones until someone clicks — no compile error, no warning — so the skill now also says to state which of the two you built when reporting. The remaining reminder folds in the consumer-kit restriction.

Separately, `references/standalone-setup.md` pointed at `examples/standalone` as its "canonical working reference". The skill is installed into a consumer project, which has no `examples/` directory — the path sent the reading model after something that isn't there. It is now the public URL.

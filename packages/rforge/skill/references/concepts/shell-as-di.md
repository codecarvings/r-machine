# Concept — i18n is DI: shells as locale-scoped services

R-Machine applies a DBMS idea to app code: the **resource namespace is a stable
contract**, the implementation is the volatile layer behind it. Consumers depend
on the namespace, not on where (or in which locale) a value lives — so swapping
the implementation, or the locale, never propagates to consumers.

That reframes i18n as **dependency injection**: a `shell` is **not** a translation
table, it's a **locale-scoped service**. When the locale changes in the shell
context, every consumer resolves _different data through the same namespace call_ —
with **no `if (locale === …)` branching** anywhere in app code.

The file model that enforces it:

- The **canonical** file (`en.tsx` / the default locale) defines the _shape_ — a
  plain object or a `Shell.define((plugin) => …)` factory when it needs
  `$.locale` / kit.
- Each **variant** file uses `localized(namespace, value)`, which is exact-key
  type-checked against the canonical shape: a missing key is a compile error, an
  extra key is `never`.

```ts
// en.tsx (canonical) — defines the shape
export const r = { title: "Product", addToCart: "Add to cart" };

// it.tsx (variant) — exact-key checked against en
export const r = localized("shell/product", {
  title: "Prodotto",
  addToCart: "Aggiungi",
});
```

Consequence (the ICU reframing): because each locale writes its _own_ surface in
its _own_ natural form, you don't need cross-locale placeholder grammars (ICU) for
ordinary content — see the rich-text pattern in
[../patterns/shell.md](../patterns/shell.md).

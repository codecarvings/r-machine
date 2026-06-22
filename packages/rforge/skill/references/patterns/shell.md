# R-Machine Patterns — Shell

Code templates for the `shell` / `shell(mono)` families. For the map-form vs
list-form plugin rule see [plugin-context.md](./plugin-context.md); to test a
Shell see [../testing.md](../testing.md).

For multi-locale shells: the canonical file is `en` (or the project's
`defaultLocale`) and exports the type; every other locale file is a sibling that
uses `localized(...)`. **Extension:** `.tsx` in React/Next projects (used in the
JSX examples below); `.ts` in a plain Node project with no JSX (see the rule in
SKILL.md Step 3).

---

## Which form? Plain object vs `Shell.define`

**Default to a plain object** — `export const r = { … }`. Members may be strings,
objects, pure functions, **and static JSX** (rich text, inline `<a>` / `<strong>`):
all static, no factory needed.

Use `Shell.define((plugin) => …)` **only when at least one member needs**, at
definition time, one of:

- a **dep** or **kit** entry (e.g. `fmt`),
- a **port** (`$.ports`),
- the **current locale** (`$.locale`).

JSX alone is **not** a reason to use `.define` — `.tsx` is the file _extension_
(SKILL.md Step 3), independent of the form.

---

## Shell — multi-locale, plain object (canonical)

Use this form when the shell is pure static translations with no dynamic logic:

```ts
// shell/product/en.tsx
import type { RShape } from "../../setup"; // adjust path depth

export const r = {
  title: "Product",
  addToCart: "Add to cart",
};

export type Shell_Product = RShape<typeof r>;
```

Locale variant (e.g. `it.tsx`):

```ts
// shell/product/it.tsx
import { localized } from "../../setup";

export const r = localized("shell/product", {
  title: "Prodotto",
  addToCart: "Aggiungi al carrello",
});
```

## Shell — multi-locale, factory form (with locale / kit / deps)

Use the factory form when the canonical shell needs dynamic logic, locale
access, kit helpers, or deps. (Map form vs list form governs how `fmt` is
reached — see [plugin-context.md](./plugin-context.md).)

```ts
// shell/greeting/en.tsx
import { Shell, type RShape } from "../../setup";

// Map form — kit entry "fmt" hoisted to top level
export const r = Shell.define((plugin) => {
  const { fmt } = plugin;
  return {
    welcome: `Welcome!`,
    number: (n: number) => fmt.number(n),
  };
});

// Alternatively, via $:
// Shell.define((plugin) => {
//   const { $ } = plugin;
//   return { number: (n) => $.kit.fmt.number(n) };
// })

export type Shell_Greeting = RShape<typeof r>;
```

**Locale variant — plain object** (when the variant does not need kit/locale):

```ts
// shell/greeting/it.tsx
import { localized } from "../../setup";

export const r = localized("shell/greeting", {
  welcome: "Benvenuto!",
  number: (n: number) => n.toLocaleString("it-IT"),
});
```

**Locale variant — with kit access** (when the variant needs `fmt` or `$.locale`):

If a member (e.g. a formatting function) must use the kit formatter, the
variant file also needs a factory. Wrap `localized` in `Shell.define`:

```ts
// shell/greeting/it.tsx
import { localized, Shell } from "../../setup";

export const r = Shell.define((plugin) => {
  const { fmt } = plugin;
  return localized("shell/greeting", {
    welcome: "Benvenuto!",
    number: (n: number) => fmt.number(n), // uses kit formatter
  });
});
```

**When to use each variant form:**

- Plain `localized(...)` → when all members are static strings or pure TS
  expressions that don't need kit/locale at definition time.
- `Shell.define` wrapping `localized(...)` → when at least one member needs
  `fmt`, `$.locale`, or `$.ports`.

For variant files with async loading:

```ts
export const r = Shell.define(async (plugin) => {
  const { fmt } = plugin;
  const data = await loadTranslations("it");
  return localized("shell/greeting", {
    welcome: data.welcome,
    number: (n) => fmt.number(n),
  });
});
```

## Shell — rich text with inline links (JSX members)

A shell member can **return JSX** — the natural way to localise a sentence with an
inline link or emphasis. Each locale writes the sentence in **its own natural word
order**, with the link/`<strong>` placed inline where that language needs it. No
ICU placeholders, no string concatenation (see
[../concepts/shell-as-di.md](../concepts/shell-as-di.md)). The file must be `.tsx`.

**Static JSX is still a plain object — no `Shell.define`** (it's static; nothing
touches kit/locale/ports). Note the different word order and link position per
locale:

```tsx
// shell/common/en.tsx — canonical (plain object; static JSX)
import type { RShape } from "../../setup";

export const r = {
  footer: (
    <>
      <strong>R-Machine</strong> e-commerce example. Learn more at{" "}
      <a href="https://rmachine.dev" className="underline font-semibold">
        rmachine.dev
      </a>
    </>
  ),
};

export type Shell_Common = RShape<typeof r>;
```

```tsx
// shell/common/it.tsx — variant: own word order, own href
import { localized } from "../../setup";

export const r = localized("shell/common", {
  footer: (
    <>
      Esempio e-commerce <strong>R-Machine</strong>. Scopri di più su{" "}
      <a href="https://rmachine.dev/it/" className="underline font-semibold">
        rmachine.dev/it
      </a>
    </>
  ),
});
```

**Dynamic styling/href** — make the member a function that takes them as props.
Still a **plain object**: a pure function needs no factory.

```tsx
// shell/common/en.tsx
export const r = {
  terms: (props: { href: string; linkClassName?: string }) => (
    <>
      By continuing you accept our{" "}
      <a href={props.href} className={props.linkClassName}>
        terms
      </a>
      .
    </>
  ),
};
```

Only if a JSX member needs `fmt` / `$.locale` does it move into `Shell.define`
(the factory form above). Rule of thumb: **bake in** what's part of the
translation (the words, a static URL); **pass in** what the consumer owns (a
dynamic href, a CSS class).

## Shell — multi-locale, with bridge gear dep

```ts
// shell/product/en.tsx
import { Shell, type RShape } from "../../setup";

// List form — dep first, $ last
export const r = Shell.withDeps("base/config") // base/config must be in bridgeGears in setup.ts
  .define((plugin) => {
    const [config, $] = plugin;
    return {
      apiInfo: `API: ${config.apiBase}`,
      currency: $.kit.fmt.number(99.99), // list form: kit via $
    };
  });

// Equivalent map form:
// Shell.withDeps({ config: "base/config" }).define((plugin) => {
//   const { config, fmt } = plugin;
//   return {
//     apiInfo: `API: ${config.apiBase}`,
//     currency: fmt.number(99.99),       // map form: kit key hoisted
//   };
// })

export type Shell_Product = RShape<typeof r>;
```

Variant files for a shell with deps use `localized` the same way (the runtime
supplies the dep; the variant only provides translation values).

## Shell — `shell(mono)` (locale-aware, single file, no variants)

Use for formatters, locale-aware helpers — no per-locale files:

```ts
// shell/lib/fmt.ts
import { Shell, type RShape } from "../../setup";

export const r = Shell.define((plugin) => {
  const { $ } = plugin;
  return {
    number: (n: number) => new Intl.NumberFormat($.locale).format(n),
    date: (d: Date) => new Intl.DateTimeFormat($.locale).format(d),
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
```

## Shell — async factory (Suspense)

A shell factory may be `async`; the consumer suspends and shows a fallback until
it resolves.

```ts
// shell/async-demo/en.tsx
import { Shell, type RShape } from "../../setup";

export const r = Shell.define(async () => {
  const data = await loadContent();
  return { title: data.title, body: data.body };
});

export type Shell_AsyncDemo = RShape<typeof r>;
```

---

## Test it

First decide which kind of shell it is — the two test the opposite way:

**Plain-object shell (no `.define`) → NO plug.** A resource declared as a plain
object (`export const r = { … }`) carries no factory, so it has **no `.plug` and
no `.create()`** — you **cannot** `mockPlug` it (that throws
`ERR_MOCK_TARGET_INVALID`). It's static data already guarded by `localized(...)`'s
exact-key type-check, so the default is to **skip the test**. If you want one,
import each locale module and assert its `r` directly — no mock:

```ts
import { r as en } from "@/r-machine/shell/home/en";
import { r as it } from "@/r-machine/shell/home/it";

it("en/it content", () => {
  expect(en.deployNow).toBe("Deploy Now");
  expect(it.deployNow).toBe("Distribuisci ora");
});
```

**Factory shell (`Shell.define`) → has a plug.** Re-resolve it per locale via
`$: { locale }` (override a kit entry with `$: { kit: { fmt: { … } } }`):

```ts
import { mockPlug } from "@r-machine/testing";
import { r as greet } from "@/r-machine/shell/greeting/en";

it("resolves the shell per locale", async () => {
  using _ctrl = mockPlug(greet).with({ $: { locale: "it" } });
  const localized = await greet.create();
  expect(localized.welcome).toBe("Benvenuto!");
});
```

See [../testing.md](../testing.md).

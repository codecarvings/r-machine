# R-Machine Patterns — Testing with `mockPlug`

`mockPlug` is the single, uniform testing primitive — it works the same way on
gears, shells, and React/server consumers. It is **typed**: a mock is bound to
the resource's real surface, so when the source types change the test fails to
compile instead of passing as a false-green. That makes tests a default in
R-Machine, not an extra — see [concepts/llm-first-testing.md](./concepts/llm-first-testing.md).

The golden rule: **mock the unit under test, then run its real code.** Pass the
unit itself to `mockPlug` — a resource (`mockPlug(r)`) or a consumer
(`mockPlug(CartButton)`) — the thing that _declares the unit's dependencies_.
Through that single mock you OVERRIDE what its dependencies, ports, and kit
resolve to (and seed/read state), then call the real `r.create()` / render the
real component. You never re-declare the unit.

**Only a factory has a plug.** `mockPlug` (and `.create()`) exist only for
resources built with a factory — `Shell.define`, `BaseGear.define`,
`OuterGear.define`, etc. A resource declared as a **plain object** (`export const
r = { … }`, the canonical form for static shells) has **no plug** — `mockPlug`
throws `ERR_MOCK_TARGET_INVALID`. Test plain objects by importing each locale
module and asserting `r` directly, or skip the test (the `localized(...)` type-check
already guards the shape).

**Where the plug lives.** A consumer does NOT export its plug; it attaches it to
the function that calls `plug.useR()` (`CartButton.plug = plug`), mirroring a
resource's `r.plug`. So you never import a bare `plug` (no wall of identically
named `plug` exports across test files) — you import the consumer/resource and
hand it to `mockPlug`. `mockPlug` accepts either the carrier (`r`, `CartButton`)
or a bare plug; the carrier is the norm.

**Never `mockPlug` a dependency's plug to test its consumer.** A unit is a black
box over its deps: it declares them but must not know their internals or their
transitive deps. To stub a dependency, override it _through the consumer's own
plug_ — by name (map form) or position (list form) — as shown below.

---

## Setup — tests are scaffolded by default

When setting up a project (Section A), check whether a test framework already
exists (`vitest.config.*`, a `vitest` devDependency, a `"test"` script). If none
exists, **propose configuring vitest** (the suggested default) and, if accepted,
generate the config + a baseline `verifyResourceAtlas` test. `@r-machine/testing`
is already a devDependency in every setup.

### `vitest.config.ts` — per mode

**Standalone / Node:**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirror the tsconfig "@/*" -> "./src/*" path mapping (Vitest does not read
    // tsconfig paths). Resource modules import setup/atlas via this alias, so
    // without it `verifyResourceAtlas` cannot load them.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Inline so Vite — not Node's raw ESM loader — resolves `@r-machine/testing`
    // and `r-machine` to a SINGLE `plug.ts` instance. Otherwise mockPlug and the
    // resolved plug live in two module instances and `getPlugResolve` reads
    // `undefined`. (This is the consumer-side fix — NOT `#r-machine/*` aliases.)
    server: { deps: { inline: ["@r-machine/testing"] } },
  },
}) as ViteUserConfig;
```

**React (Vite):**

```ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    server: { deps: { inline: ["@r-machine/testing"] } },
  },
}) as ViteUserConfig;
```

**Next.js:** same as React but inline the Next adapter too, because
`@r-machine/next` imports Next internals (`next/navigation`) and
`verifyResourceAtlas` loads `setup.ts` through the bundler graph:

```ts
    server: { deps: { inline: ["@r-machine/next", "@r-machine/testing"] } },
```

Also alias `server-only` to a no-op in `resolve.alias`. `verifyResourceAtlas`
imports the server-only `prv/loader.ts` (to pick up the `inner/` loader), and
that file starts with `import "server-only"`, whose default resolution throws
outside an RSC bundle:

```ts
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": "@r-machine/next/dev/no-op",
    },
    dedupe: ["react", "react-dom"],
  },
```

**No `src/` directory? Adjust the alias and the verify paths.** All snippets here
assume source under `src/` (`@/*` → `./src/*`). A default `create-next-app` (and
many Vite setups) keep source at the **repo root** with `@/*` → `./*`. Read the
project's `tsconfig.json` `paths` and mirror it: when there's no `src/`, the alias
becomes `"@": fileURLToPath(new URL(".", import.meta.url))` and every
`import.meta.resolve("../../src/r-machine/…")` in a test drops the `src/` segment
(`"../../r-machine/setup.ts"`). The same applies to `proxy.ts`, which sits at the
source root — repo root when there's no `src/`.

### `vitest.setup.ts` (React / Next only)

```ts
import "@testing-library/jest-dom/vitest";
```

Dev dependencies to add for React/Next test setups: `vitest`,
`@vitejs/plugin-react`, `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`.

### Type-check the tests (required — not optional)

Vitest does **not** fail a run on TypeScript errors in the test code. So a mock
whose surface has drifted from the source would still pass green — silently
defeating the whole point of typed mocks (R-Machine's core guarantee). Make the
`test` script **compile first, then run**:

```jsonc
// package.json — Next.js / Standalone (single tsconfig that includes tests/)
"scripts": {
  "typecheck": "tsc --noEmit",
  "test": "tsc --noEmit && vitest run"
}
```

```jsonc
// package.json — React (Vite) with TS project references (tsconfig.app/node/test)
"scripts": {
  "typecheck": "tsc -b --noEmit",
  "test": "tsc -b --noEmit && vitest run"
}
```

The project's `tsconfig` must **include the test directory** so the test files
(and their mocks) are themselves type-checked — that is what turns a drifted mock
into a failed `test` run instead of a false green.

**Make the vitest globals type-visible (required, or `tsc` fails first).** The
baseline test (and the examples below) use the globals `describe` / `it` /
`expect` without importing them. Vitest's runner provides them at runtime, but
`tsc` doesn't know them → the first `typecheck` fails with `TS2582: Cannot find
name 'describe'`. Don't fix this by adding `"types": ["vitest/globals"]` to
`compilerOptions` — that key **restricts** which `@types/*` are auto-included, so
in a Next/React project it drops the ambient `node`/`react` types and breaks the
build. Instead add a one-line ambient reference file at the project root so the
globals are visible **without** narrowing `types`:

```ts
// vitest.d.ts
/// <reference types="vitest/globals" />
```

(Equivalently, import `{ describe, it, expect }` from `"vitest"` in every test —
but the ambient file keeps the examples copy-paste-clean.)

### Baseline test — `verifyResourceAtlas`

Static + runtime check that every namespace in the ResourceAtlas resolves through
the loader (and every shell has all locale variants). Scaffold this first:

```ts
// tests/r-machine/setup.test.ts
import { verifyResourceAtlas } from "@r-machine/testing";

describe("setup.ts ResourceAtlas", () => {
  it("every declared atlas key resolves for every locale", async () => {
    const report = await verifyResourceAtlas(
      import.meta.resolve("../../src/r-machine/setup.ts"),
    );
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.totalChecks).toBeGreaterThan(0);
  });
});
```

**Next.js (split `pub/` + `prv/`)**: `setup.ts` only imports `pub/loader`, so the
server-only `inner/` prefix is unregistered during verify. Pass the
`prv/loader.ts` via the `loaders` option so its `inner/` resources are checked
too (requires the `server-only` no-op alias in the vitest config, above):

```ts
const report = await verifyResourceAtlas(
  import.meta.resolve("../../src/r-machine/setup.ts"),
  { loaders: [import.meta.resolve("../../src/r-machine/prv/loader.ts")] },
);
```

**Standalone has no strategy**, so point it at the exported `RMachine` instance:

```ts
const report = await verifyResourceAtlas(
  import.meta.resolve("../../src/r-machine/setup.ts"),
  { strategyExportName: "rMachine" }, // the export name of the RMachine instance
);
```

### Test file placement

Tests live in a top-level `tests/` directory that **mirrors `src/`** — a source
file `src/<path>.ext` gets its test at `tests/<path>.test.ts(x)`. Do **not**
flatten into one folder.

- `src/r-machine/pub/outer/cart.ts` → `tests/r-machine/pub/outer/cart.test.ts`
- `src/components/client/cart-view.tsx` → `tests/components/client/cart-view.test.tsx`

For a **multi-locale shell** (a folder of per-locale files), name the test after
the shell, at the folder's level — not per-locale:

- `src/r-machine/pub/shell/home/{en,it}.tsx` → `tests/r-machine/pub/shell/home.test.ts`

---

## The two-channel model

`mockPlug(unit)` returns a controller and works on two independent channels:

1. **Resolution overrides** (what a dependency/port/kit resolves to) — passed up
   front via `.with({ … })`. Keys:
   - **named or positional deps** — `{ shared: { … } }` (map form) or `{ 0: { … } }`
     (list form / DirectPlug).
   - **`$.ports`** — substitute external functions.
   - **`$.kit`** — override a kit entry (e.g. `{ $: { kit: { fmt: { … } } } }`).
   - **`$.locale`** — re-resolve a resource plug in a locale (shells, DirectPlug deps).
   - **`$.ambientLocale`** — set the locale for an ambient/component consumer that
     would otherwise read it from a provider.
2. **State controller** (the live state cells) — read/written through the returned
   controller AFTER `.with(...)`: `ctrl.state`, `ctrl.deps[key].state`,
   `ctrl.kit[key].state`. Writes before resolve are deep-partial **seeds**; reads
   and writes after resolve hit the live cell.

`.default()` is `.with({})` — enter test mode with no overrides (e.g. resolve a
stateless gear, or resolve at the machine's default locale).

The controller is disposable: prefer the `using` keyword (auto-exits test mode at
scope end); otherwise call `ctrl.reset()`. `resetMockPlugs()` clears every active
mock as a safety net (e.g. in an `afterEach`).

---

## Test a stateless gear (Base / Inner) — mock the port, run the real members

```ts
import { mockPlug } from "@r-machine/testing";
import { type Product, r } from "@/r-machine/prv/inner/catalog";

it("resolves products through the async port and looks them up", async () => {
  // Mock only the async port; the real `base/store-config` dep still resolves.
  // Stateless → `using` just exits test mode at scope end.
  using _ctrl = mockPlug(r).with({
    $: { ports: { fetchProducts: async () => FIXTURES } },
  });

  const catalog = await r.create();

  expect(catalog.byId("b")?.name).toBe("Beta");
  expect(catalog.byCategory("audio").map((p) => p.id)).toEqual(["a", "c"]);
});
```

## Test an OuterGear (state + ports + relay)

```ts
import { mockPlug } from "@r-machine/testing";
import { r } from "@/r-machine/pub/outer/cart";

// Seed the SSR-snapshot port to an empty cart so each test starts clean.
const seedEmpty = () =>
  mockPlug(r).with({
    $: { ports: { loadCartSnapshot: async () => ({ lines: [] }) } },
  });

it("adds items and computes itemCount + subtotal", async () => {
  using _ctrl = seedEmpty();
  const cart = await r.create();

  cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
  cart.addItem({ productId: "b", name: "Beta", unitPrice: 20, qty: 2 });

  expect(cart.itemCount()).toBe(3); // real getters run against the live cell
  expect(cart.subtotal()).toBe(50);
});
```

Seed the gear's **own** state directly with `ctrl.state` (deep-partial — other
keys survive):

```ts
using ctrl = mockPlug(r).with({
  $: {
    ports: {
      /* … */
    },
  },
});
ctrl.state = { count: 10 }; // seed before create(); `label` etc. preserved
const inst = await r.create();
expect(inst.count()).toBe(10);
```

A relay's `onChange` runs for real — assert its side effect (here via a spy):

```ts
const logSpy = vitest.spyOn(console, "log").mockImplementation(() => {});
const cart = await r.create();
cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
expect(logSpy).toHaveBeenCalledWith("cart changed: 1 line(s)");
```

## Test a Shell

A **plain-object** shell (`export const r = { … }`, no `.define`) has **no plug
and no `.create()`** — `mockPlug` throws `ERR_MOCK_TARGET_INVALID` on it. Default
to **no test** (its shape is already guarded by `localized(...)`); if you want
one, import each locale module and assert `r` directly. A **factory** shell
(`Shell.define`, uses `$.locale` / kit) has a plug — re-resolve it per locale via
`$: { locale }`:

```ts
import { mockPlug } from "@r-machine/testing";
import { r as greet } from "@/r-machine/pub/shell/greeting/en";

it("resolves the shell in the requested locale", async () => {
  const def = await greet.create();
  expect(def.greeting).toBe("Hello"); // default locale

  using _ctrl = mockPlug(greet).with({ $: { locale: "it" } });
  const localized = await greet.create();
  expect(localized.greeting).toBe("Ciao");
});
```

Override a kit entry the shell uses with `$: { kit: { … } }`:

```ts
using _ctrl = mockPlug(greet).with({
  $: { kit: { fmt: { number: () => "MOCK" } } },
});
```

## Test a dependency override (list form / DirectPlug)

`mockPlug` mocks the REAL plug the code under test uses; other deps stay real.
For list-form deps (and `DirectPlug("a", "b")`), keys are positional:

```ts
import { mockPlug } from "@r-machine/testing";
import { render } from "../src/render.ts"; // render.plug = DirectPlug("shell/greeting","base/config")

it("substitutes the greeting shell; base/config stays real", async () => {
  using _ctrl = mockPlug(render).with({
    0: { title: "Mock", greet: (name: string) => `MOCK ${name}` },
  });

  const out = await render("en"); // the REAL render runs against the mock
  expect(out).toContain("MOCK Sergio");
  expect(out).toContain("app: R-Machine Standalone"); // base/config resolved for real
});
```

## Test a React / ClientPlug consumer component

Render the component WITHOUT a provider — `mockPlug(OuterGearDemo)` relaxes the
provider guard and sets the locale via `$.ambientLocale`. Seed the dependency's
state with `ctrl.deps[index].state`; the real getters/actions run, so a UI
interaction re-renders through real reactivity (no manual rerender).

```ts
import { mockPlug } from "@r-machine/testing";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { OuterGearDemo } from "@/components/.../outer-gear-demo";

it("renders seeded state and reacts to the real action", async () => {
  using ctrl = mockPlug(OuterGearDemo).with({ $: { ambientLocale: "it" } });
  ctrl.deps[0].state = { value: 4, isOdd: false }; // before render

  await act(async () => { render(<OuterGearDemo />); });

  expect(await screen.findByText("4")).toBeInTheDocument();
  expect(screen.getByText("8")).toBeInTheDocument(); // doubled cell (4*2)

  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "+10" })); });
  expect(screen.getByText("14")).toBeInTheDocument(); // real add() published to the cell
});
```

For a **Next** client component, also stub `next/navigation` (the client toolset
reads its hooks during render):

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/cart",
}));
```

## Test a Server component / page (ServerPlug)

Run in `node`. Mock the **component itself** (`mockPlug(ProductPage)` — its plug
is attached as `ProductPage.plug` and declares the component's deps), not a
dependency's plug. `.default()` enters test mode and resolves at the default
locale; pass `useR(params)` to bind the locale from route params. Stub a
dependency's surface _through this plug_ by position/name.

```ts
// @vitest-environment node
import { mockPlug } from "@r-machine/testing";
// Import just the page — its plug rides along as `ProductPage.plug`:
import ProductPage from "@/app/[locale]/product/[id]/page";
import type { Product } from "@/r-machine/prv/inner/catalog";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const PRODUCT: Product = {
  id: "kbd-01",
  name: "Mock Keyboard",
  category: "peripherals",
  price: 529.99,
  blurb: "",
};

it("resolves via useR(params) and renders the product, price formatted server-side", async () => {
  // ProductPage.plug = ServerPlug("inner/catalog", "shell/product", "shell/catalog") — list form.
  // Override dep 0 (the catalog) THROUGH the page; the shells stay real.
  using _ctrl = mockPlug(ProductPage).with({
    0: { byId: (id: string) => (id === PRODUCT.id ? PRODUCT : undefined) },
  });

  const el = await ProductPage({
    params: Promise.resolve({ locale: "en", id: "kbd-01" }),
  } as never);
  const text = treeText(el as ReactNode); // walk the element tree for raw strings
  expect(text).toContain("Mock Keyboard");
  expect(text).toContain("$529.99"); // fmt kit, en → USD
});
```

## Error assertion

The preferred shape is try/catch + `expect.unreachable` (assert the code, not
just `.toThrow`):

```ts
try {
  render(<ReactRMachine locale="xx">child</ReactRMachine>);
  expect.unreachable("should have thrown for an invalid locale");
} catch (error) {
  expect(error).toBeInstanceOf(RMachineError);
  expect((error as RMachineError).message).toContain("xx");
}
```

---

## Gotchas

- **Single plug instance (the big one).** `mockPlug` and the resolved plug must
  share one `plug.ts` module instance. In a consumer project the fix is
  `server: { deps: { inline: ["@r-machine/testing"] } }` in `vitest.config.ts`
  (plus `@r-machine/next` for Next). Without it, `getPlugResolve` reads
  `undefined` and mocks silently do nothing. (The `#r-machine/*` source aliases
  are a monorepo-internal concern — do NOT add them to a consumer project.)
- **Drive a relay with a "tick", not a field-equal object.** An action that
  returns a new but field-equal object (`{ n: 1 }` twice) is collapsed by
  `deepPartialMerge` to the same reference, so an identity-based relay won't
  re-run. In tests that must force a re-run, change a numeric cell.
- **Fake timers for interval-based gears.** Freeze `setInterval`-driven state
  with `vi.useFakeTimers()` / `vi.useRealTimers()` so only the action under test
  moves the value.
- **`using` vs `reset()`.** Prefer `using ctrl = mockPlug(...)` (TS auto-dispose).
  A second mock on the same plug before reset throws `ERR_PLUG_ALREADY_MOCKED`.
  Use `resetMockPlugs()` in `afterEach` as a safety net.
- **Pass the carrier, not a bare `plug`.** A consumer attaches its plug
  (`Comp.plug = plug`); hand the consumer/resource to `mockPlug` (`mockPlug(Comp)`,
  `mockPlug(r)`). Passing something with no plug attached — a component that forgot
  its `.plug` line, or a stray value — throws `ERR_MOCK_TARGET_INVALID`.

---

## Diagnostics (dev mode & event bus)

R-Machine emits structured events you can observe. Families: `blueprint:*`
(resolution/caching), `res:*` (factory build/disposal), `wire:*` (consumer
wiring), `relay:*` (updates/errors, incl. `relay:loopDetected`).

- **Live tracing in dev** — log every event:

  ```ts
  if (process.env.NODE_ENV !== "production") enableRMachineDevMode(rMachine);
  ```

- **Assert on events in a test** — collect and inspect:

  ```ts
  const collector = createEventCollector(rMachine);
  // …trigger work…
  expect(collector.events.some((e) => e.type === "relay:loopDetected")).toBe(
    true,
  );
  collector.dispose();
  ```

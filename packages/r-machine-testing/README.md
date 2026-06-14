⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# @r-machine/testing — Testing utilities for R-Machine

[![NPM Version](https://img.shields.io/npm/v/%40r-machine%2Ftesting?label=latest)](https://www.npmjs.com/package/@r-machine/testing)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

> Part of [R-Machine](https://rmachine.dev) — requires the
> [`r-machine`](https://www.npmjs.com/package/r-machine) core.

Testing utilities for R-Machine. The centerpiece is **`mockPlug`** — the _single_
override primitive. It works uniformly across every resource family (gears, shells,
vertex) and every consumer (plain `create()` calls or React components), inheriting
the same boundary behaviour as a real `Plug`. Calling it also enters test mode,
relaxing the client/server usage guards so resources resolve without a provider.

## Install

```sh
npm install -D @r-machine/testing
# peer: r-machine   (optional: typescript >= 5.0 for verifyResourceAtlas)
```

## Usage

`mockPlug(r.plug)` returns a disposable controller. Use `.default()` to run the
real resource, or `.with({ ... })` to override its plugin context (`$.state`,
`$.ports`, `$.locale`, …) and dependencies:

```ts
import { mockPlug } from "@r-machine/testing";
import { expect, test } from "vitest";
import { r as timerR } from "../src/r-machine/outer/timer";

test("timer starts at zero", async () => {
  // `using` auto-disposes the mock at end of scope; `.default()` runs the real gear.
  using _ctrl = mockPlug(timerR.plug).default();
  using timer = await timerR.create();

  expect(timer.value()).toBe(0);
});
```

### The controller: drive real state, assert on the changes

`mockPlug` doesn't hand you a fake surface — the controller drives the **real**
state cell of a resource (or its dependencies). The real getters, memo cells and
actions run, so a UI interaction re-renders through real reactivity, and you can
read the state back through the same controller to assert what changed.

`ctrl.deps[i].state` is the seed-and-observe handle for the i-th dependency:

```tsx
import { mockPlug } from "@r-machine/testing";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CartView, plug } from "@/components/client/cart-view";

test("removing a line updates the real cart state", async () => {
  using ctrl = mockPlug(plug).with({ $: { locale: "it" } });

  // 1. SEED the dependency's real state before render.
  ctrl.deps[0].state = {
    lines: [
      {
        productId: "kbd-01",
        name: "Mechanical Keyboard",
        unitPrice: 129.99,
        qty: 1,
      },
      { productId: "mon-01", name: "4K Monitor", unitPrice: 1299, qty: 2 },
    ],
  };

  await act(async () => render(<CartView />));
  expect(screen.getByText("3 articoli")).toBeInTheDocument(); // real getter, it-pluralized

  // 2. Trigger the REAL `removeItem` action — no manual rerender.
  await act(async () =>
    fireEvent.click(screen.getAllByRole("button", { name: "Rimuovi" })[1]),
  );

  // 3. OBSERVE the resulting state through the same controller.
  expect((ctrl.deps[0].state as { lines: unknown[] }).lines).toHaveLength(1);
  expect(screen.getByText("1 articolo")).toBeInTheDocument();
});
```

If your environment lacks `using` (explicit resource management), call
`resetMockPlugs()` in an `afterEach` hook instead.

Two more helpers:

- **`verifyResourceAtlas(setupFile)`** — asserts every shell resolves in every
  configured locale, catching missing translations at test time.
- **`createEventCollector()`** — captures resource lifecycle events for assertions.

## Documentation

→ Full reference: [`llms-full.txt`](https://rmachine.dev/llms-full.txt) · real test
suites in
[`examples/next/tests`](https://github.com/codecarvings/r-machine/tree/main/examples/next/tests)
and
[`examples/react/tests`](https://github.com/codecarvings/r-machine/tree/main/examples/react/tests).

---

## License

`@r-machine/testing` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `@r-machine/testing` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.

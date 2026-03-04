# Test Refactor — @r-machine/react

Miglioramenti suggeriti dalla review della test suite. Nessuno rappresenta una lacuna critica — sono ottimizzazioni incrementali.

## 1. Timer reali in react-toolset.test.tsx

**File**: `tests/unit/core/react-toolset.test.tsx:166-188`
**Test**: "delays fallback when using default Suspense"

Usa `screen.findByText("delayed-fallback", {}, { timeout: 1000 })` con timer reali e un'attesa effettiva di ~300ms. Tutti gli altri test che verificano il delay (in `delayed-suspense.test.tsx`) usano `vi.useFakeTimers()`.

**Rischio**: Flakiness sotto carico CI + rallentamento della suite.

**Fix**: Usare `vi.useFakeTimers()` + `vi.advanceTimersByTime(300)`.

## 2. Inconsistenza nei pattern di asserzione errori

Tre pattern diversi usati nei test:

```ts
// Pattern A — class check
expect(() => ...).toThrow(RMachineError);

// Pattern B — structured check
expect(() => ...).toThrow(expect.objectContaining({ code: ERR_CONTEXT_NOT_FOUND }));

// Pattern C — try/catch
try {
  renderHook(() => useSetLocale());
  expect.unreachable("should have thrown");
} catch (error) {
  expect(error).toBeInstanceOf(RMachineError);
  expect(error).toHaveProperty("code", ERR_CONTEXT_NOT_FOUND);
}
```

**Fix**: Standardizzare su un unico pattern. Il pattern B con `objectContaining` e' un buon compromesso:

```ts
expect(() => ...).toThrow(expect.objectContaining({
  name: "RMachineUsageError",
  code: ERR_CONTEXT_NOT_FOUND,
  message: expect.stringContaining("not found"),
}));
```

## 3. Casting `(machine as any).hybridPickR`

**File**: `react-strategy-core.test.tsx:165`, `react-standard-strategy-core.test.tsx:203`, `react-toolset.test.tsx:447`, `react-bare-toolset.test.tsx:574`

Il mock viene acceduto con `(machine as any).hybridPickR` per verificare le chiamate spy.

**Fix**: Aggiungere un tipo helper in `tests/helpers/mock-machine.ts` che espone i metodi spy senza casting:

```ts
export type MockMachine = ReturnType<typeof createMockMachine>;
// nei test: (machine as MockMachine).hybridPickR
```

## 4. error-codes.test.ts — Verifica valori specifici

**File**: `tests/unit/errors/error-codes.test.ts`

Il test attuale e' generico (stringhe non vuote e uniche). Un cambio accidentale del valore di una costante non verrebbe intercettato.

**Fix**: Aggiungere asserzioni esplicite:

```ts
it("exports ERR_CONTEXT_NOT_FOUND with expected value", () => {
  expect(errorCodes.ERR_CONTEXT_NOT_FOUND).toBe("ERR_CONTEXT_NOT_FOUND");
});
it("exports ERR_MISSING_WRITE_LOCALE with expected value", () => {
  expect(errorCodes.ERR_MISSING_WRITE_LOCALE).toBe("ERR_MISSING_WRITE_LOCALE");
});
```

## 5. Test mancante: ordering async writeLocale in react-toolset

**File**: `tests/unit/core/react-toolset.test.tsx`

`react-bare-toolset.test.tsx:401-425` ha un test esplicito sull'ordering ("awaits an async writeLocale"). Il corrispettivo in `react-toolset.test.tsx` manca.

**Fix**: Aggiungere nel describe `useSetLocale`:

```ts
it("awaits async impl.writeLocale before setLocale resolves", async () => {
  const order: string[] = [];
  const writeLocale = vi.fn(async () => {
    await new Promise<void>((r) => setTimeout(r, 10));
    order.push("writeLocale-done");
  });
  const impl = createMockImpl({ readLocale: () => "en", writeLocale });
  const { ReactRMachine, useSetLocale } = await createReactToolset(createMockMachine(), impl);

  const { result } = renderHook(() => useSetLocale(), {
    wrapper: ({ children }: { children: ReactNode }) => <ReactRMachine>{children}</ReactRMachine>,
  });

  await act(async () => {
    await result.current("it");
    order.push("setLocale-done");
  });

  expect(order).toEqual(["writeLocale-done", "setLocale-done"]);
});
```

## 6. Test mancante: cambio prop Suspense mid-lifecycle

**File**: `tests/unit/core/react-toolset.test.tsx`

In `react-toolset.tsx:93-96`, `SuspenseComponent` e' memoizzato con `[Suspense]` come dipendenza. Non c'e' un test che verifica il comportamento quando la prop `Suspense` cambia tra un render e l'altro.

**Fix**: Aggiungere nel describe `ReactRMachine (Suspense prop)`:

```tsx
it("handles Suspense prop changing from a component to null", async () => {
  const impl = createMockImpl({ readLocale: () => "en" });
  const { ReactRMachine } = await createReactToolset(createMockMachine(), impl);

  const { rerender } = render(
    <ReactRMachine Suspense={React.Suspense}>
      <div>child</div>
    </ReactRMachine>,
  );

  rerender(
    <ReactRMachine Suspense={null}>
      <div>child</div>
    </ReactRMachine>,
  );

  screen.getByText("child");
});
```

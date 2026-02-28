# Skill: Generate Unit Tests

Generate high-quality unit tests for this project, matching the standards of a senior software engineer. Tests must verify actual behavior — never assume existing code is correct. Avoid tautological tests.

## Trigger

Use when the user asks to generate, add, or write unit tests for a module, function, class, or file.

## Workflow

### Phase 1 — Analysis (MANDATORY before writing any test)

1. **Read the source code** under test in full. Understand its public API, internal branching, error paths, async behavior, and edge cases.
2. **Read existing tests** for the same module (if any) to avoid duplication and understand what's already covered.
3. **Read existing test helpers and fixtures** in the package's `tests/helpers/` and `tests/unit/_fixtures/` directories to reuse them.
4. **Read the source's dependencies** to understand what can be mocked and what should be exercised.
5. **Identify the testing boundary**: determine what is the unit under test vs. what should be mocked/stubbed. Mock external dependencies; exercise the unit's own logic.

### Phase 2 — Test Design

Before writing code, plan the test suite structure:

1. **Group by behavior**, not by implementation detail. Use describe blocks for: constructor/factory, each public method, error scenarios, edge cases, integration between methods.
2. **Prioritize tests that catch real bugs**: invalid inputs, boundary conditions, race conditions, cache invalidation, error propagation, async/sync transitions.
3. **Avoid tautological tests**: never test that a mock returns what you told it to return. Test that the *unit under test* uses the mock's output correctly.
4. **Test observable behavior, not implementation**: assert on return values, thrown errors, side effects (mock calls), and state changes — not on private internals.

### Phase 3 — Code Generation

Write the test file following these project conventions exactly:

---

## Conventions Reference

### File Location & Naming

- Test files: `packages/<pkg>/tests/unit/<module-path>/<module-name>.test.ts` (or `.test.tsx` for React)
- Mirror the source directory structure exactly
- Helpers go in `tests/helpers/`, fixtures in `tests/unit/_fixtures/`

### Import Order (strict)

```typescript
// 1. vitest imports
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 2. Testing library imports (React tests only)
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";

// 3. Third-party imports
import React from "react";

// 4. Project source imports (the unit under test and its dependencies)
import { SomeClass } from "../../../src/module/some-class.js";
import type { SomeType } from "../../../src/module/some-type.js";

// 5. Test helpers and fixtures
import { createMockX } from "../../helpers/mock-x.js";
```

**Critical**: Use `import type { ... }` for type-only imports. Always include `.js` extension in relative imports.

### Test Structure

```typescript
// Section separators for top-level logical groups
// ---------------------------------------------------------------------------
// ModuleName
// ---------------------------------------------------------------------------

describe("ModuleName", () => {
  // Sub-sections with lighter separators
  // -----------------------------------------------------------------------
  // constructor / factory
  // -----------------------------------------------------------------------

  describe("constructor", () => {
    it("creates an instance with valid config", () => { ... });
    it("throws for invalid input X", () => { ... });
  });

  describe("methodName", () => {
    it("returns X when Y", () => { ... });
    it("rejects when Z", async () => { ... });
  });

  describe("edge cases", () => { ... });
});
```

### Describe/It Naming

- **describe blocks**: feature name, method name, or logical group (`"constructor"`, `"pickR"`, `"error handling"`, `"concurrent resolution"`, `"edge cases"`)
- **it blocks**: declarative behavior statements:
  - `"creates an instance with a valid config"`
  - `"throws for an empty locales array"`
  - `"returns a promise when not cached, then the value when cached"`
  - `"deduplicates concurrent calls to the same namespace"`
  - `"allows retry after resolver rejection"`

### Test Data & Fixtures

- Use minimal, meaningful test data:

```typescript
const commonR = { greeting: "hello" };
const navR = { home: "Home", about: "About" };
```

- Use factory functions for configurations:

```typescript
function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    locales: ["en", "it"],
    defaultLocale: "en",
    resolver: createMockResolver(allModules),
    ...overrides,
  };
}

function createInstance(overrides: Partial<Config> = {}) {
  return new MyClass(makeConfig(overrides));
}
```

### Mocking Patterns

- Use `vi.fn()` for function mocks
- Use existing helpers: `createMockMachine()`, `createMockImpl()`, `createMockResolver()`, `createDelayedResolver()`
- Verify mock interactions with specific assertions:

```typescript
expect(resolver).toHaveBeenCalledWith("common", "en");
expect(resolver).toHaveBeenCalledTimes(1);
expect(resolver).not.toHaveBeenCalled();
```

- For partial mock overrides:

```typescript
const machine = createMockMachine({
  hybridPickR: () => someResource,
});
```

### Assertion Patterns

**Identity & value checks:**
```typescript
expect(result).toBe(exactRef);          // strict reference equality
expect(result).toEqual([a, b]);         // deep equality
expect(result).toBeInstanceOf(MyClass);
expect(result).toBeDefined();
expect(result).toBeNull();
```

**Error assertions — use the structured pattern:**
```typescript
// Preferred: structured check with objectContaining
expect(() => doThing()).toThrow(
  expect.objectContaining({
    name: "RMachineUsageError",
    code: ERR_SOME_CODE,
    message: expect.stringContaining("relevant detail"),
  })
);

// Also acceptable: class check for simpler cases
expect(() => doThing()).toThrow(RMachineError);

// For complex error inspection (innerError etc.):
try {
  doThing();
  expect.unreachable("should have thrown");
} catch (error) {
  expect(error).toBeInstanceOf(RMachineError);
  expect((error as RMachineError).innerError).toBeInstanceOf(RMachineError);
}
```

**Async assertions:**
```typescript
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(ErrorClass);
await expect(promise).rejects.toThrow(/pattern/);
```

**Mock call assertions:**
```typescript
expect(fn).toHaveBeenCalledWith("arg1", "arg2");
expect(fn).toHaveBeenCalledTimes(1);
expect(fn).toHaveBeenCalledOnce();
expect(fn).not.toHaveBeenCalled();
```

### React-Specific Patterns

**Cleanup (required at file top level):**
```typescript
afterEach(cleanup);
```

**Component rendering:**
```typescript
render(
  <Provider locale="en">
    <div>content</div>
  </Provider>
);
screen.getByText("content");
```

**Hook testing:**
```typescript
const { result } = renderHook(() => useMyHook(), {
  wrapper: ({ children }: { children: ReactNode }) => (
    <Provider locale="en">{children}</Provider>
  ),
});
expect(result.current).toBe("en");
```

**Interaction testing:**
```typescript
await act(async () => {
  await result.current("it");  // call setter
});
```

**Suspense testing (throw-to-suspend):**
```typescript
let thrown: unknown;
function Thrower() {
  try { useR("common"); } catch (e) { thrown = e; throw e; }
  return null;
}

render(
  <Provider locale="en">
    <React19ErrorBoundary><Thrower /></React19ErrorBoundary>
  </Provider>
);

expect(thrown).toBeInstanceOf(Promise);
```

**Fake timers (for delay-based components):**
```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

await act(async () => {
  vi.advanceTimersByTime(DELAY);
});
```

### Parameterized Tests

Use `describe.each` or `it.each` for testing shared behavior across methods:

```typescript
const methods = [
  { name: "pickR", pick: (d: Domain, ns: string) => d.pickR(ns) },
  { name: "hybridPickR", pick: (d: Domain, ns: string) => Promise.resolve(d.hybridPickR(ns)) },
] as const;

describe.each(methods)("$name — shared behavior", ({ pick }) => {
  it("resolves to the correct resource", async () => {
    expect(await pick(domain, "common")).toBe(commonR);
  });
});
```

### What NOT To Do

1. **No tautological tests**: Do not test `expect(mock()).toBe(whatYouSetTheMockTo)`.
2. **No testing private internals**: Only test through the public API.
3. **No unnecessary comments**: Test names are the documentation. Only add comments for non-obvious test setup rationale.
4. **No over-mocking**: If a dependency is simple and deterministic, use the real thing.
5. **No real timers for delay tests**: Always use `vi.useFakeTimers()`.
6. **No `as any` casts**: Use proper types or create typed helpers.
7. **No snapshot tests**: Use explicit assertions.
8. **No generic "should work" test names**: Be specific about what behavior is verified.
9. **No redundant wrappers**: Don't abstract for a single use — three similar lines are fine.
10. **No tests that pass regardless of implementation**: Every test must be able to fail if the code under test has a bug.

### Test Quality Checklist

Before finalizing, verify each test against these criteria:

- [ ] **Fails if the code is broken**: Would this test catch a real bug?
- [ ] **Tests one behavior**: Each `it` block verifies a single, clear expectation.
- [ ] **Uses minimal setup**: No unnecessary fixtures or mocks beyond what the test needs.
- [ ] **Assertions are specific**: Not just "does not throw" — asserts the correct value/error.
- [ ] **Async is handled correctly**: Promises are awaited, act() wraps state changes.
- [ ] **Error paths are tested**: Invalid inputs, rejected promises, thrown exceptions.
- [ ] **Edge cases are covered**: Empty inputs, boundary values, concurrent access, cache states.
- [ ] **Follows project conventions**: Import order, naming, file location, assertion patterns.

## Phase 4 — Validation

After writing tests:

1. Run the tests with `pnpm test` (or package-specific: `pnpm vitest run packages/<pkg>`) to verify they pass.
2. Run `pnpm check` to verify Biome formatting compliance.
3. Review each test mentally: "If I introduce bug X in the source, will this test catch it?"

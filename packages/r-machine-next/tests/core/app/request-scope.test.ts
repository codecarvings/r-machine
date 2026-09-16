import type { RequestScope } from "r-machine/core";
import { afterEach, describe, expect, it } from "vitest";
import { nextRequestScopeProvider } from "../../../src/core/app/request-scope.js";

// The override is module-level state that persists across tests in the file, so
// every test clears it on the way out to stay order-independent.
const fakeScope = (tag: string): RequestScope => ({ tag }) as unknown as RequestScope;

describe("nextRequestScopeProvider", () => {
  afterEach(() => {
    nextRequestScopeProvider.setOverride?.(null);
  });

  it("has no active scope before any override is set", () => {
    expect(nextRequestScopeProvider.getActiveScope()).toBeNull();
  });

  it("makes the override the active scope until it is cleared with null", () => {
    const scope = fakeScope("a");

    nextRequestScopeProvider.setOverride?.(scope);
    expect(nextRequestScopeProvider.getActiveScope()).toBe(scope);

    nextRequestScopeProvider.setOverride?.(null);
    expect(nextRequestScopeProvider.getActiveScope()).toBeNull();
  });

  it("restores an outer scope when a nested window hands back the previous value", () => {
    // Mirrors the React adapter's save/restore around the wire resolution.
    const outer = fakeScope("outer");
    const inner = fakeScope("inner");
    nextRequestScopeProvider.setOverride?.(outer);

    const prev = nextRequestScopeProvider.getActiveScope();
    nextRequestScopeProvider.setOverride?.(inner);
    expect(nextRequestScopeProvider.getActiveScope()).toBe(inner);
    nextRequestScopeProvider.setOverride?.(prev);

    expect(nextRequestScopeProvider.getActiveScope()).toBe(outer);
  });
});

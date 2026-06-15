import type { RequestScope } from "r-machine/core";
import { describe, expect, it } from "vitest";
import { lookupScope, registerScope, unregisterScope } from "../../../src/core/app/scope-registry.js";

// The registry lives on globalThis (shared across Node bundle contexts), so it
// persists across tests in the worker — each test uses a unique id to stay
// isolated.
const fakeScope = (tag: string): RequestScope => ({ tag }) as unknown as RequestScope;

describe("scope-registry", () => {
  it("registers a scope and looks it up by id", () => {
    const scope = fakeScope("a");
    registerScope("sr-a", scope);
    expect(lookupScope("sr-a")).toBe(scope);
  });

  it("returns null for an unknown id", () => {
    expect(lookupScope("sr-never-registered")).toBeNull();
  });

  it("unregisters a scope so a later lookup is null", () => {
    const scope = fakeScope("b");
    registerScope("sr-b", scope);
    expect(lookupScope("sr-b")).toBe(scope);

    unregisterScope("sr-b");
    expect(lookupScope("sr-b")).toBeNull();
  });

  it("shares one global registry across calls (lazy-init only once)", () => {
    registerScope("sr-c", fakeScope("c"));
    registerScope("sr-d", fakeScope("d"));
    expect(lookupScope("sr-c")).not.toBeNull();
    expect(lookupScope("sr-d")).not.toBeNull();
  });
});
